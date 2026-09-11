import prisma from '../config/prisma.js';
import logger from '../utils/logger.js';

const mapLetterToDelivery = (letter) => {
    // Map Priority
    // Delivery: NORMAL | URGENT
    // Letter: Low | Medium | High
    let priority = "NORMAL";
    if (letter.priority === "High") priority = "URGENT";

    // Map Status
    // Delivery: "pending_approval" | "completed" | "returned"
    // Letter: Pending_Approval, Approved, Assigned, In_Transit, Delivered, Undelivered
    // We should probably preserve the detailed status if the app supports it, but types say strict.
    // However, TypeScript types in frontend might be loose or subsets.
    // Let's map to strings that the app likely handles or just pass status if it handles others.
    // Given the types: pending_approval | completed | returned... this is very restrictive.
    // Maybe the app only shows these? 
    // If I send "In_Transit", will it crash? 
    // Looking at deliveryService.ts, it returns Promise<Delivery[]>. 
    // The type definition is just for TS. Runtime JSON is what matters.
    // If the APP UI expects specific strings for icons/colors, I might need to be careful.
    // But usually "In_Transit" is fine. I'll pass letter.status.toLowerCase() or keep as is?
    // LetterStatus is PascalCase in DB enum? Or string? Prisma schema says enum.
    // Response typically sends string. 
    // Let's send the letter status as is, assuming frontend handles it or I map "Delivered" -> "completed".

    let status = letter.status;
    if (status === 'Delivered') status = 'completed';
    if (status === 'Undelivered') status = 'returned';
    if (status === 'In_Transit') status = 'In-Transit'; // Ensure formatting

    return {
        id: letter.id.toString(),
        trackingId: letter.trackingId,
        scheduleId: letter.id.toString(),
        companyName: letter.senderDirectorate?.name || 'Unknown',
        title: letter.subject,
        destination: letter.recipientAddress,
        lga: letter.lgaAddress,
        liabilityYear: letter.liabilityYear,
        status: status.toLowerCase(), // Frontend types are lowercase
        priority: priority,
        liabilityAmount: Number(letter.liabilityValue),
        submittedAt: letter.createdAt,
        assignedCourierId: letter.courierId?.toString(),
        assignedAt: letter.assignedAt,
        completedAt: letter.deliveredAt,
        notes: letter.notes,
        // pod: ... // If needed
    };
};

export const get_schedules = async (req, res) => {
    try {
        const where = {};

        // If courier, only assigned
        if (req.user.role === "Courier") {
            const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
            if (courier) {
                where.courierId = courier.id;
            } else {
                return res.status(200).json([]);
            }
        }

        const letters = await prisma.letter.findMany({
            where,
            include: {
                senderDirectorate: true,
                courier: true
            },
            orderBy: { createdAt: "desc" }
        });

        const deliveries = letters.map(mapLetterToDelivery);
        return res.status(200).json(deliveries);
    } catch (err) {
        logger.error("Get Schedules Error:", err);
        return res.status(500).json({ error: err.message });
    }
};

export const get_schedule_by_id = async (req, res) => {
    try {
        const { id } = req.params;
        const letter = await prisma.letter.findUnique({
            where: { id: BigInt(id) },
            include: {
                senderDirectorate: true,
                courier: true
            }
        });

        if (!letter) return res.status(404).json({ message: "Not found" });

        return res.status(200).json(mapLetterToDelivery(letter));
    } catch (err) {
        logger.error("Get Schedule Error:", err);
        return res.status(500).json({ error: err.message });
    }
};

export const update_schedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const letter = await prisma.letter.findUnique({ where: { id: BigInt(id) } });
        if (!letter) return res.status(404).json({ message: "Not found" });

        // Map frontend status 'completed' -> 'Delivered'
        let backendStatus = status;
        if (status === 'completed') backendStatus = 'Delivered';
        if (status === 'returned') backendStatus = 'Undelivered';
        if (status === 'pending') backendStatus = 'Pending_Approval'; // or similar

        // If status is "In_Transit" or similar, just use it (ensure Case match with Enum if Prisma strict)
        // Prisma Enum: Pending_Approval, Approved, Assigned, In_Transit, Delivered, Undelivered
        // Frontend likely sends lowercase.
        // We need to match Enum.

        const statusMap = {
            'pending': 'Pending_Approval',
            'completed': 'Delivered',
            'returned': 'Undelivered',
            'in-transit': 'In_Transit',
            'in_transit': 'In_Transit',
            'delivered': 'Delivered',
            'undelivered': 'Undelivered'
        };

        if (statusMap[status.toLowerCase()]) {
            backendStatus = statusMap[status.toLowerCase()];
        }

        const data = {};
        if (backendStatus) data.status = backendStatus;
        if (notes) data.notes = notes;
        if (backendStatus === 'Delivered') data.deliveredAt = new Date();

        const updated = await prisma.letter.update({
            where: { id: BigInt(id) },
            data
        });

        // Timeline
        await prisma.letterTimeline.create({
            data: {
                letterId: BigInt(id),
                status: backendStatus || "Updated",
                description: `Schedule updated via App. Status: ${status}`,
                userId: BigInt(req.user.id)
            }
        });

        return res.status(200).json({ success: true, data: null }); // ApiResponse<null>
    } catch (err) {
        logger.error("Update Schedule Error:", err);
        return res.status(500).json({ error: err.message });
    }
};
