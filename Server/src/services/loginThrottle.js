/**
 * Failed-login throttling (UAT AUTH-007: "repeated invalid login
 * attempts do not trigger throttling, delay, or account lockout").
 *
 * Policy, as specified by the product owner:
 *   - warn the user once they have burned 3 of their 5 attempts
 *   - the 5th consecutive failure starts a one-hour lockout
 *   - a successful login clears the counter
 *
 * Keying: attempts are counted per (client IP, email) pair rather than
 * per email alone. Locking on email alone would let anyone who knows a
 * colleague's address lock them out of the system on demand, turning a
 * brute-force control into a denial-of-service tool. The tradeoff is
 * that an attacker rotating source IPs gets a fresh budget per IP; that
 * is the accepted trade here, and a network-level control is the right
 * place to catch distributed attempts.
 *
 * Storage is the rate_limits table, which already existed in the schema
 * for exactly this purpose and was previously unused.
 */
import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

export const MAX_ATTEMPTS = 5;
export const WARN_AFTER_ATTEMPTS = 3;
export const LOCKOUT_MS = 60 * 60 * 1000; // one hour

const keyFor = (email) => `login:${String(email || '').trim().toLowerCase()}`.slice(0, 255);
const ipFor = (req) => String(req.ip || req.socket?.remoteAddress || 'unknown').slice(0, 45);

const findRecord = (ipAddress, endpoint) =>
    prisma.rateLimit.findFirst({ where: { ipAddress, endpoint } });

/** Whole minutes still to wait, always at least 1 so we never say "0 minutes". */
const minutesRemaining = (windowStart) =>
    Math.max(1, Math.ceil((LOCKOUT_MS - (Date.now() - new Date(windowStart).getTime())) / 60000));

/**
 * Call before checking credentials.
 * @returns {{ locked: boolean, message?: string, retryAfterSeconds?: number }}
 */
export const checkLoginAllowed = async (req, email) => {
    try {
        const record = await findRecord(ipFor(req), keyFor(email));
        if (!record) return { locked: false };

        const elapsed = Date.now() - new Date(record.windowStart).getTime();

        // Counter (locked or not) is stale once the window has passed.
        if (elapsed >= LOCKOUT_MS) {
            await prisma.rateLimit.delete({ where: { id: record.id } }).catch(() => {});
            return { locked: false };
        }

        if (record.requests >= MAX_ATTEMPTS) {
            const mins = minutesRemaining(record.windowStart);
            return {
                locked: true,
                retryAfterSeconds: mins * 60,
                message:
                    `Too many failed sign-in attempts. This account is locked for another ` +
                    `${mins} minute${mins === 1 ? '' : 's'}. Try again later, or contact your administrator.`,
            };
        }

        return { locked: false };
    } catch (err) {
        // A throttling outage must not become a login outage.
        logger.error(`Login throttle check failed (allowing request): ${err.message}`);
        return { locked: false };
    }
};

/**
 * Call after a failed credential check.
 * @returns {{ attempts: number, remaining: number, lockedNow: boolean, warning?: string }}
 */
export const recordFailedLogin = async (req, email) => {
    try {
        const ipAddress = ipFor(req);
        const endpoint = keyFor(email);
        const record = await findRecord(ipAddress, endpoint);

        let attempts;
        if (!record) {
            await prisma.rateLimit.create({
                data: { ipAddress, endpoint, requests: 1, windowStart: new Date() },
            });
            attempts = 1;
        } else {
            attempts = record.requests + 1;
            await prisma.rateLimit.update({
                where: { id: record.id },
                // windowStart tracks the most recent failure, so the hour
                // is counted from the failure that triggered the lock.
                data: { requests: attempts, windowStart: new Date() },
            });
        }

        const remaining = Math.max(0, MAX_ATTEMPTS - attempts);
        const lockedNow = attempts >= MAX_ATTEMPTS;

        let warning;
        if (lockedNow) {
            warning =
                `Too many failed sign-in attempts. This account is now locked for 60 minutes. ` +
                `Try again later, or contact your administrator.`;
        } else if (attempts >= WARN_AFTER_ATTEMPTS) {
            warning =
                `${remaining} attempt${remaining === 1 ? '' : 's'} remaining before this account ` +
                `is locked for 60 minutes.`;
        }

        return { attempts, remaining, lockedNow, warning };
    } catch (err) {
        logger.error(`Login throttle record failed: ${err.message}`);
        return { attempts: 0, remaining: MAX_ATTEMPTS, lockedNow: false };
    }
};

/** Call after a successful login - clears the counter for that pair. */
export const clearLoginAttempts = async (req, email) => {
    try {
        await prisma.rateLimit.deleteMany({
            where: { ipAddress: ipFor(req), endpoint: keyFor(email) },
        });
    } catch (err) {
        logger.error(`Login throttle clear failed: ${err.message}`);
    }
};
