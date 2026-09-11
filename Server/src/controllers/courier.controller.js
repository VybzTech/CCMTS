import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

// Grouped by courier (falls back to "unassigned") for the same reason
// as the web upload path in middleware/upload.js - see that file's
// header comment.
const saveBase64Image = async (base64String, filename, courierId) => {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
        buffer = Buffer.from(matches[2], 'base64');
    } else {
        buffer = Buffer.from(base64String, 'base64');
    }

    const courierSegment = courierId ? courierId.toString() : 'unassigned';
    const uploadDir = path.join('uploads', 'pod', courierSegment);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, `${filename}.jpg`);
    await fs.promises.writeFile(filepath, buffer);
    // Normalize to forward slashes - path.join gives back backslashes on
    // Windows, which break when this path is later served as a URL
    // under the /uploads static mount.
    return filepath.split(path.sep).join('/');
};

// ... existing code ...

export const acknowledge_pod = async (req, res) => {
    try {
        const { deliveryId, recipientName, signature, photos, notes, timestamp } = req.body;

        const letter = await prisma.letter.findUnique({
            where: { id: BigInt(deliveryId) }
        });

        if (!letter) {
            return res.status(404).json({ message: "Letter not found" });
        }

        let podPath = null;
        if (photos && photos.length > 0) {
            podPath = await saveBase64Image(photos[0], `pod-${deliveryId}-${Date.now()}`, letter.courierId);
        } else if (signature) {
            podPath = await saveBase64Image(signature, `sig-${deliveryId}-${Date.now()}`, letter.courierId);
        }

        const data = {
            status: 'Delivered',
            deliveredAt: timestamp ? new Date(timestamp) : new Date(),
        };
        if (recipientName) data.recipientName = recipientName;
        if (notes) data.notes = notes;
        if (podPath) data.podImagePath = podPath;

        const updatedLetter = await prisma.letter.update({
            where: { id: BigInt(deliveryId) },
            data
        });

        if (updatedLetter.courierId) {
            await prisma.courier.update({
                where: { id: updatedLetter.courierId },
                data: {
                    completedDeliveries: { increment: 1 },
                    activeTasks: { decrement: 1 }
                }
            });
        }

        await prisma.letterTimeline.create({
            data: {
                letterId: BigInt(deliveryId),
                status: "Delivered",
                description: "POD Acknowledged and Delivery Confirmed via Mobile App",
                userId: BigInt(req.user.id)
            }
        });

        return res.status(200).json({ success: true, message: "POD Acknowledged" });

    } catch (err) {
        logger.error("POD Error:", err);
        return res.status(500).json({ error: err.message });
    }
};

export const create_courier = async (req, res) => {
    try {
        const { name, email, phone, base_lga, other_branches_lga } = req.body;

        const new_courier = await prisma.courier.create({
            data: {
                name,
                email,
                phone,
                baseLga: base_lga,
                otherBranchesLga: other_branches_lga || [],
                availability: true,
                activeTasks: 0,
                performance: 100,
                completedDeliveries: 0
            }
        });

        return res.status(201).json({
            message: "Courier Created",
            courier: {
                id: new_courier.id.toString(),
                name: new_courier.name,
                email: new_courier.email,
                phone: new_courier.phone
            }
        });
    } catch (err) {
        logger.error("Courier error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const get_couriers = async (req, res) => {
    try {
        const couriers = await prisma.courier.findMany({
            where: {
                availability: true
            },
            orderBy: {
                performance: 'desc'
            }
        });

        return res.status(200).json({
            couriers: couriers.map(c => ({
                ...c,
                id: c.id.toString()
            }))
        });
    } catch (err) {
        logger.error("Courier error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const get_courier_by_id = async (req, res) => {
    try {
        const { courier_id } = req.params;

        const courier = await prisma.courier.findUnique({
            where: { id: BigInt(courier_id) },
            include: {
                letters: {
                    where: {
                        status: {
                            in: ['Assigned', 'In_Transit']
                        }
                    }
                }
            }
        });

        if (!courier) {
            return res.status(404).json({
                message: "Courier not found"
            });
        }

        return res.status(200).json({
            courier: {
                ...courier,
                id: courier.id.toString(),
                letters: courier.letters.map(l => ({
                    ...l,
                    id: l.id.toString(),
                    courierId: l.courierId?.toString(),
                    senderDirectorateId: l.senderDirectorateId.toString(),
                    createdById: l.createdById.toString(),
                    approvedById: l.approvedById?.toString()
                }))
            }
        });
    } catch (err) {
        logger.error("Courier error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const update_courier_availability = async (req, res) => {
    try {
        const { courier_id } = req.params;
        const { availability } = req.body;

        const updated_courier = await prisma.courier.update({
            where: { id: BigInt(courier_id) },
            data: { availability }
        });

        return res.status(200).json({
            message: "Courier availability updated",
            courier: {
                id: updated_courier.id.toString(),
                name: updated_courier.name,
                availability: updated_courier.availability
            }
        });
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({
                message: "Courier not found"
            });
        }
        logger.error("Courier error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};

export const update_courier_performance = async (req, res) => {
    try {
        const { courier_id } = req.params;
        const { delivered } = req.body;

        const courier = await prisma.courier.findUnique({
            where: { id: BigInt(courier_id) }
        });

        if (!courier) {
            return res.status(404).json({
                message: "Courier not found"
            });
        }

        const updated_courier = await prisma.courier.update({
            where: { id: BigInt(courier_id) },
            data: {
                completedDeliveries: { increment: delivered ? 1 : 0 },
                activeTasks: { decrement: 1 }
            }
        });

        return res.status(200).json({
            message: "Courier stats updated",
            courier: {
                id: updated_courier.id.toString(),
                name: updated_courier.name,
                completedDeliveries: updated_courier.completedDeliveries,
                activeTasks: updated_courier.activeTasks
            }
        });
    } catch (err) {
        logger.error("Courier error:", err);
        return res.status(500).json({
            message: 'Internal Server Error',
            error: err.message
        });
    }
};
