import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

export const create_directorate = async (req, res) => {
    try {
        const { name, code, description } = req.body;

        const directorate = await prisma.directorate.create({
            data: {
                name,
                code,
                description
            }
        });

        return res.status(201).json({
            message: "Directorate Created",
            directorate: {
                id: directorate.id.toString(),
                name: directorate.name,
                code: directorate.code
            }
        });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({
                message: "Directorate code already exists"
            });
        }
        logger.error("Directorate error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const get_directorates = async (req, res) => {
    try {
        const directorates = await prisma.directorate.findMany({
            orderBy: { name: 'asc' }
        });

        return res.status(200).json({
            directorates: directorates.map(d => ({
                ...d,
                id: d.id.toString()
            }))
        });
    } catch (err) {
        logger.error("Directorate error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const get_directorate_by_id = async (req, res) => {
    try {
        const { directorate_id } = req.params;

        const directorate = await prisma.directorate.findUnique({
            where: { id: BigInt(directorate_id) },
            include: {
                users: {
                    select: { id: true, name: true, email: true, role: true }
                },
                letters: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        trackingId: true,
                        subject: true,
                        status: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!directorate) {
            return res.status(404).json({
                message: "Directorate not found"
            });
        }

        return res.status(200).json({
            directorate: {
                ...directorate,
                id: directorate.id.toString(),
                users: directorate.users.map(u => ({
                    ...u,
                    id: u.id.toString()
                })),
                letters: directorate.letters.map(l => ({
                    ...l,
                    id: l.id.toString()
                }))
            }
        });
    } catch (err) {
        logger.error("Directorate error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const update_directorate = async (req, res) => {
    try {
        const { directorate_id } = req.params;
        const { name, description } = req.body;

        const directorate = await prisma.directorate.update({
            where: { id: BigInt(directorate_id) },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            }
        });

        return res.status(200).json({
            message: "Directorate updated",
            directorate: {
                id: directorate.id.toString(),
                name: directorate.name,
                code: directorate.code,
                description: directorate.description
            }
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({
                message: "Directorate not found"
            });
        }
        logger.error("Directorate error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const delete_directorate = async (req, res) => {
    try {
        const { directorate_id } = req.params;

        await prisma.directorate.delete({
            where: { id: BigInt(directorate_id) }
        });

        return res.status(200).json({
            message: "Directorate deleted"
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({
                message: "Directorate not found"
            });
        }
        if (err.code === 'P2003') {
            return res.status(400).json({
                message: "Cannot delete directorate with associated users or letters"
            });
        }
        logger.error("Directorate error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};
