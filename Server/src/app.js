import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import net from 'node:net';

// Logger imports
import logger from './utils/logger.js';
import morganMiddleware from './middleware/logger.middleware.js';

import lettersRoutes from './routes/letter.route.js';
import couriersRoutes from './routes/courier.route.js';
import directoratesRoutes from './routes/directorate.route.js';
import authRoutes from './routes/auth.route.js';
import scheduleRoutes from './routes/schedule.route.js';
import usersRoutes from './routes/user.route.js';
import prisma from './config/prisma.js';

// Fix for BigInt serialization
BigInt.prototype.toJSON = function () {
    return this.toString();
};

dotenv.config();

const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key] || process.env[key].trim() === '');

if (missingEnvVars.length > 0) {
    logger.error(
        `Missing required environment variable${missingEnvVars.length > 1 ? 's' : ''}: ${missingEnvVars.join(', ')}`
    );
    process.exit(1);
}

const app = express();

const checkRedisConnection = () => {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
        return Promise.resolve();
    }

    const { hostname, port } = new URL(redisUrl);

    return new Promise((resolve, reject) => {
        const socket = net.createConnection(
            { host: hostname, port: Number(port || 6379) },
            () => {
                socket.end();
                resolve();
            }
        );

        socket.setTimeout(5000);
        socket.on('timeout', () => {
            socket.destroy(new Error(`Timed out connecting to Redis at ${hostname}:${port || 6379}`));
        });
        socket.on('error', reject);
    });
};

const bootstrap = async () => {
    try {
        await prisma.$connect();

        // Redis (Titan KV) is no longer load-bearing - nothing in this
        // app uses BullMQ anymore (see services/allocationService.js's
        // header comment for why), so a missing/unreachable Redis
        // shouldn't take the whole API down. /health still reports its
        // status for visibility.
        try {
            await checkRedisConnection();
        } catch (err) {
            logger.warn(`Redis unreachable at boot (non-fatal, nothing currently depends on it): ${err.message}`);
        }

        // Middlewares
        app.use(morganMiddleware);
        const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:5174')
            .split(',')
            .map((origin) => origin.trim());

        app.use(cors({
            origin: allowedOrigins,
            credentials: true
        }));
        app.use(helmet());
        app.use(cookieParser());
        app.use(express.json());
        app.use('/uploads', express.static('uploads'));

        // Health check - unauthenticated, used by NSSM/PM2/monitoring to
        // confirm the process is up and its dependencies are reachable.
        app.get('/health', async (req, res) => {
            const [dbCheck, redisCheck] = await Promise.allSettled([
                prisma.$queryRaw`SELECT 1`,
                checkRedisConnection(),
            ]);

            const health = {
                status: dbCheck.status === 'fulfilled' && redisCheck.status === 'fulfilled' ? 'ok' : 'degraded',
                uptimeSeconds: Math.round(process.uptime()),
                database: dbCheck.status === 'fulfilled' ? 'connected' : 'error',
                redis: redisCheck.status === 'fulfilled' ? 'connected' : 'error',
                timestamp: new Date().toISOString(),
            };

            return res.status(health.status === 'ok' ? 200 : 503).json(health);
        });

        // Routes
        app.use('/api/v1/letters', lettersRoutes);
        app.use('/api/v1/schedules', scheduleRoutes);
        app.use('/api/v1/couriers', couriersRoutes);
        app.use('/api/v1/directorates', directoratesRoutes);
        app.use('/api/v1/auth', authRoutes);
        app.use('/api/v1/users', usersRoutes);

        // Global Error Handler
        app.use((err, req, res, next) => {
            logger.error(`${err.message} - ${req.method} ${req.url} - ${req.ip}`);
            res.status(err.status || 500).json({
                message: err.message || 'Internal Server Error',
                error: process.env.NODE_ENV === 'development' ? err : {}
            });
        });

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            logger.info(`DLTS IS RUNNING ON http://localhost:${PORT}`);
        });
    } catch (err) {
        logger.error(`Startup check failed: ${err.message}`);
        await prisma.$disconnect().catch(() => {});
        process.exit(1);
    }
};

bootstrap();
