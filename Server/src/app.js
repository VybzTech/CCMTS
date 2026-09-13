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
        // UAT NFR-007 (raised by both the Admin and Management testers):
        // "HTTP redirects to HTTPS but responses carry no HSTS header."
        // helmet() does set one by default, so a response without it did
        // not come from this app - TLS terminates at the AWS ALB in front
        // of us and that is where the tested response was served from
        // (see DIAGNOSTIC-REPORT-2026-08-10.md section 4). Pinned
        // explicitly anyway so the value is one year rather than helmet's
        // 180-day default, and so the intent is visible here.
        // NOTE: the edge terminating TLS must send this too - setting it
        // here only covers responses that actually reach Express.
        app.use(
            helmet({
                hsts: {
                    maxAge: 31536000, // 1 year, the preload-list minimum
                    includeSubDomains: true,
                    preload: true,
                },
            })
        );
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

            // Redis (Titan KV) is NOT load-bearing - nothing uses BullMQ
            // anymore - so it must not decide the HTTP status. It did, and
            // a stopped KV made a perfectly healthy API serve 503 to every
            // monitor for ~2 weeks (DIAGNOSTIC-REPORT-2026-08-10.md s.3).
            // Reported for visibility; only the DB gates the status code.
            const health = {
                status: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
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
