import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';

const SAFE_USER_SELECT = {
    id: true,
    name: true,
    email: true,
    role: true,
    directorateId: true,
    disabled: true,
    mustResetPassword: true,
    createdAt: true,
};

const toSafeUser = (user) => ({
    ...user,
    id: user.id.toString(),
    directorateId: user.directorateId?.toString() ?? null,
});

export const get_users = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: SAFE_USER_SELECT,
            orderBy: { name: 'asc' },
        });

        return res.status(200).json({ users: users.map(toSafeUser) });
    } catch (err) {
        logger.error('List Users Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

export const create_user = async (req, res) => {
    try {
        const { name, email, password, role, directorateId } = req.body;

        const hashed_password = await bcrypt.hash(password, 10);

        const new_user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed_password,
                role: role || 'ODU',
                directorateId: directorateId ? BigInt(directorateId) : null,
            },
        });

        if (role === 'Courier') {
            await prisma.courier.create({
                data: {
                    userId: new_user.id,
                    name: new_user.name,
                    email: new_user.email,
                    baseLga: req.body.base_lga || 'IKEJA',
                },
            });
        }

        return res.status(201).json({
            message: 'User Created',
            user: {
                id: new_user.id.toString(),
                name: new_user.name,
                email: new_user.email,
                role: new_user.role,
            },
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Email already in use' });
        }
        logger.error('Create User Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

export const update_user = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, directorateId } = req.body;

        const updated = await prisma.user.update({
            where: { id: BigInt(id) },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(role !== undefined && { role }),
                ...(directorateId !== undefined && {
                    directorateId: directorateId === null ? null : BigInt(directorateId),
                }),
            },
            select: SAFE_USER_SELECT,
        });

        return res.status(200).json({ message: 'User updated', user: toSafeUser(updated) });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        if (err.code === 'P2002') {
            return res.status(400).json({ message: 'Email already in use' });
        }
        logger.error('Update User Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

export const set_user_disabled = async (req, res) => {
    try {
        const { id } = req.params;
        const { disabled } = req.body;

        const updated = await prisma.user.update({
            where: { id: BigInt(id) },
            data: { disabled: Boolean(disabled) },
            select: SAFE_USER_SELECT,
        });

        return res.status(200).json({
            message: disabled ? 'User disabled' : 'User enabled',
            user: toSafeUser(updated),
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        logger.error('Set User Disabled Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};

// Shared default a Management user relays to whoever they just reset -
// forces a real password on next successful login via mustResetPassword.
const SHARED_RESET_PASSWORD = 'Lirs123';

export const reset_user_password = async (req, res) => {
    try {
        const { id } = req.params;

        const hashed = await bcrypt.hash(SHARED_RESET_PASSWORD, 10);

        await prisma.user.update({
            where: { id: BigInt(id) },
            data: { password: hashed, mustResetPassword: true },
        });

        return res.status(200).json({
            message: 'Password reset',
            temporaryPassword: SHARED_RESET_PASSWORD,
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'User not found' });
        }
        logger.error('Reset Password Error:', err);
        return res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
};
