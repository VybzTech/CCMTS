import jwt from 'jsonwebtoken';
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookie first, then Authorization header
        if (req.cookies?.jwt) {
            token = req.cookies.jwt;
        } else if (req.headers.authorization?.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                message: 'Not authorized, no token provided'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const user = await prisma.user.findUnique({
            where: { id: BigInt(decoded.id) },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                directorateId: true,
                disabled: true,
                mustResetPassword: true
            }
        });

        if (!user) {
            return res.status(401).json({
                message: 'Not authorized, user not found'
            });
        }

        if (user.disabled) {
            return res.status(403).json({
                message: 'This account has been disabled'
            });
        }

        // Attach user to request
        req.user = user;
        next();

    } catch (err) {
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Not authorized, invalid token'
            });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Not authorized, token expired'
            });
        }
        logger.error("Auth Middleware Error:", err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};


export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};
