    import path from "node:path";
    import prisma from "../config/prisma.js";
    import logger from "../utils/logger.js";
    import { runAllocation } from "../services/allocationService.js";

    // Helper to generate tracking ID
    const generateTrackingId = async () => {
    const year = new Date().getFullYear();
    const lastLetter = await prisma.letter.findFirst({
        where: {
        trackingId: {
            startsWith: `LTR-${year}-`
        }
        },
        orderBy: {
        trackingId: 'desc'
        }
    });

    let nextNum = 1;
    if (lastLetter) {
        const lastNum = parseInt(lastLetter.trackingId.split('-')[2]);
        nextNum = lastNum + 1;
    }

    return `LTR-${year}-${String(nextNum).padStart(3, '0')}`;
    };

    // Helper to notify all admins
    const notifyAdmins = async (title, message, letterId) => {
    try {
        const admins = await prisma.user.findMany({
        where: { role: "Admin" },
        select: { id: true }
        });

        if (admins.length > 0) {
        await prisma.notification.createMany({
            data: admins.map(admin => ({
            userId: admin.id,
            type: "info",
            title,
            message,
            letterId: BigInt(letterId)
            }))
        });
        }
    } catch (error) {
        logger.error("Notify Admins Error:", error);
    }
    };

    export const generate_single_letter = async (req, res) => {
    const details = req.body;

    try {
        const trackingId = await generateTrackingId();

        const new_letter = await prisma.letter.create({
        data: {
            trackingId,
            senderDirectorateId: BigInt(details.sender_directorate_id),
            createdById: BigInt(req.user.id),
            recipientName: details.recipient_name,
            recipientAddress: details.recipient_address,
            lgaAddress: details.lga_address,
            subject: details.subject,
            priority: details.priority || "Medium",
            liabilityValue: details.liability_value || 0,
            liabilityYear: details.liability_year?.toString() || new Date().getFullYear().toString(),
            notes: details.notes
        },
        });

        // Create timeline entry
        await prisma.letterTimeline.create({
        data: {
            letterId: new_letter.id,
            status: "Registered",
            description: "Letter registered in the system",
            userId: BigInt(req.user.id)
        }
        });

        return res.status(201).json({
        message: "Letter Created",
        letter: {
            id: new_letter.id.toString(),
            trackingId: new_letter.trackingId,
            subject: new_letter.subject,
            priority: new_letter.priority,
            status: new_letter.status
        },
        });
    } catch (error) {
        logger.error("Create Letter Error:", error);
        return res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
        });
    }
    };

    export const generate_bulk_letter = async (req, res) => {
    try {
        const letters = req.body;

        if (!Array.isArray(letters) || letters.length === 0) {
        return res.status(400).json({
            message: "Invalid input: Expected a non-empty array of letters.",
        });
        }

        const createdLetters = [];

        for (const letter of letters) {
        const trackingId = await generateTrackingId();

        const new_letter = await prisma.letter.create({
            data: {
            trackingId,
            senderDirectorateId: BigInt(letter.sender_directorate_id),
            createdById: BigInt(req.user.id),
            recipientName: letter.recipient_name,
            recipientAddress: letter.recipient_address,
            lgaAddress: letter.lga_address,
            subject: letter.subject,
            priority: letter.priority || "Medium",
            liabilityValue: letter.liability_value || 0,
            liabilityYear: letter.liability_year?.toString() || new Date().getFullYear().toString(),
            notes: letter.notes
            }
        });

        // Create timeline entry for each letter
        await prisma.letterTimeline.create({
            data: {
            letterId: new_letter.id,
            status: "Registered",
            description: "Letter registered in the system",
            userId: BigInt(req.user.id)
            }
        });

        createdLetters.push(new_letter);
        }

        return res.status(201).json({
        message: "Letters Created successfully",
        count: createdLetters.length,
        });
    } catch (err) {
        logger.error("Bulk Letter Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
        });
    }
    };

    export const approve_letter = async (req, res) => {
    const letter_id = req.params.letter_id;

    try {
        // 1. Fetch the letter and the DHL courier
        const [letter, dhlCourier] = await Promise.all([
        prisma.letter.findUnique({ where: { id: BigInt(letter_id) } }),
        prisma.courier.findFirst({ where: { name: { contains: "DHL" }, availability: true } })
        ]);

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        let status = "Approved";
        let courierId = null;
        let assignedAt = null;

        // 2. Immediate DHL Check (High Priority, High Value, or Explicit Out-of-State)
        if (dhlCourier && (
        letter.priority === "High" ||
        Number(letter.liabilityValue) > 25000000 ||
        letter.lgaAddress === "NOT_LAGOS"
        )) {
        status = "Assigned";
        courierId = dhlCourier.id;
        assignedAt = new Date();
        }

        // 3. Update Letter Status
        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data: {
            status,
            courierId,
            assignedAt,
            approvedById: BigInt(req.user.id),
            approvedAt: new Date()
        },
        });

        // 4. Update Courier task count if assigned
        if (status === "Assigned" && courierId) {
        await prisma.courier.update({
            where: { id: courierId },
            data: { activeTasks: { increment: 1 } }
        });
        }


        // 6. Timeline and Notification
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: status,
            description: status === "Assigned" ? `Letter approved and auto-assigned to DHL` : `Letter approved by ${req.user.name}`,
            userId: BigInt(req.user.id)
        }
        });

        await prisma.notification.create({
        data: {
            userId: letter.createdById,
            type: "success",
            title: status === "Assigned" ? "Letter Approved & Assigned" : "Letter Approved",
            message: `Your letter ${letter.trackingId} has been ${status.toLowerCase()}.`,
            letterId: letter.id
        }
        });

        return res.status(200).json({
        message: status === "Assigned" ? "Letter Approved and Assigned to DHL" : "Letter Approved",
        letter: {
            id: updatedLetter.id.toString(),
            trackingId: updatedLetter.trackingId,
            status: status
        }
        });

    } catch (err) {
        if (err.code === 'P2025') {
        return res.status(404).json({ message: "Letter not found" });
        }
        logger.error("Approve Letter Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
        });
    }
    };

    export const reject_letter = async (req, res) => {
    const letter_id = req.params.letter_id;
    const { reason } = req.body;

    try {
        const letter = await prisma.letter.update({
        where: {
            id: BigInt(letter_id),
        },
        data: {
            status: "Undelivered",
        },
        });

        // Create timeline entry - status mirrors the letter's actual
        // enum value (there is no distinct "Rejected" status, see
        // schema.prisma's LetterStatus), the rejection reason lives in
        // the description instead.
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: "Undelivered",
            description: `Rejected: ${reason || "no reason provided"}`,
            userId: BigInt(req.user.id)
        }
        });

        // Create notification for the letter creator
        await prisma.notification.create({
        data: {
            userId: letter.createdById,
            type: "error",
            title: "Letter Rejected",
            message: `Your letter ${letter.trackingId} has been rejected.`,
            letterId: letter.id
        }
        });

        return res.status(200).json({
        message: "Letter Rejected",
        });
    } catch (err) {
        if (err.code === 'P2025') {
        return res.status(404).json({
            message: "Letter not found"
        });
        }
        logger.error("Reject Letter Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
        });
    }
    };

    export const trigger_auto_allocation = async (req, res) => {
    try {
        const { letterIds } = req.body;

        if (!Array.isArray(letterIds) || letterIds.length === 0) {
        return res.status(400).json({
            message: "Invalid input: Please provide a non-empty array of letter IDs.",
        });
        }

        // Filter to only include letters with Approved status
        const approvedLetters = await prisma.letter.findMany({
        where: {
            id: { in: letterIds.map(id => BigInt(id)) },
            status: "Approved",
        },
        select: { id: true },
        });

        if (approvedLetters.length === 0) {
        return res.status(400).json({
            message: "No approved letters found among the provided IDs.",
            skipped: letterIds.length,
        });
        }

        const approvedIds = approvedLetters.map((l) => l.id.toString());
        const skippedCount = letterIds.length - approvedIds.length;

        // Fire-and-forget: runs in this same Node process rather than a
        // Redis-backed queue (see allocationService.js's header comment
        // for why - Titan KV can't back a real job queue). Errors are
        // logged since nothing here awaits the result.
        runAllocation(approvedIds).catch((err) => {
        logger.error("Auto Allocation background error:", err);
        });

        return res.status(202).json({
        message: "Allocation engine started in the background",
        processing: approvedIds.length,
        skipped: skippedCount,
        });
    } catch (error) {
        logger.error("Auto Allocation Error:", error);
        res.status(500).json({ error: error.message });
    }
    };

    export const allocate_letter = async (req, res) => {
    const { letter_id, courier_id } = req.params;

    try {
        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data: {
            courierId: BigInt(courier_id),
            status: "Assigned",
            assignedAt: new Date(),
        },
        include: {
            courier: {
            select: {
                name: true,
                phone: true,
            },
            },
        },
        });

        // Update courier active tasks
        await prisma.courier.update({
        where: { id: BigInt(courier_id) },
        data: {
            activeTasks: { increment: 1 }
        }
        });

        // Create timeline entry
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: "Assigned",
            description: `Assigned to courier: ${updatedLetter.courier.name}`,
            userId: BigInt(req.user.id)
        }
        });

        // Create notification for letter creator
        await prisma.notification.create({
        data: {
            userId: updatedLetter.createdById,
            type: "info",
            title: "Courier Assigned",
            message: `A courier has been assigned to your letter ${updatedLetter.trackingId}.`,
            letterId: updatedLetter.id
        }
        });

        return res.status(200).json({
        message: "Letter successfully allocated to courier.",
        data: {
            ...updatedLetter,
            id: updatedLetter.id.toString(),
            courierId: updatedLetter.courierId?.toString(),
            senderDirectorateId: updatedLetter.senderDirectorateId.toString(),
            createdById: updatedLetter.createdById.toString(),
            approvedById: updatedLetter.approvedById?.toString()
        },
        });
    } catch (err) {
        if (err.code === "P2025") {
        return res.status(404).json({
            message: "Letter not found. Check the letter ID.",
        });
        }

        logger.error("Manual Allocation Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message,
        });
    }
    };

    export const mark_in_transit = async (req, res) => {
    const { letter_id } = req.params;

    try {
        const letter = await prisma.letter.findUnique({
        where: { id: BigInt(letter_id) },
        include: { courier: true }
        });

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        // Authorization: Only assigned courier or Admin
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (!courier || letter.courierId !== courier.id) {
            return res.status(403).json({ message: "You are not authorized to update this letter" });
        }
        }

        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data: { status: "In_Transit" }
        });

        // Create timeline entry
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: "In-Transit",
            description: "Letter is in transit",
            userId: BigInt(req.user.id)
        }
        });

        // Notify the creator
        await prisma.notification.create({
        data: {
            userId: updatedLetter.createdById,
            type: "info",
            title: "Letter In-Transit",
            message: `Your letter ${updatedLetter.trackingId} is now In-Transit.`,
            letterId: updatedLetter.id
        }
        });

        // Notify Admin
        await notifyAdmins(
        "Letter In-Transit",
        `Letter ${updatedLetter.trackingId} has been picked up by ${req.user.name}`,
        updatedLetter.id
        );

        return res.status(200).json({
        message: "Letter marked as in transit",
        letter: {
            id: updatedLetter.id.toString(),
            trackingId: updatedLetter.trackingId,
            status: updatedLetter.status
        }
        });
    } catch (err) {
        logger.error("In-Transit Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message
        });
    }
    };

    export const mark_delivered = async (req, res) => {
    const { letter_id } = req.params;
    // Normalize to forward slashes - Windows' path.join gives back
    // backslashes, which break when this path is later served/rendered
    // as a URL under the /uploads static mount.
    const podImagePath = req.file ? req.file.path.split(path.sep).join('/') : null;

    try {
        const letter = await prisma.letter.findUnique({
        where: { id: BigInt(letter_id) }
        });

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        // Authorization: Only assigned courier or Admin
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (!courier || letter.courierId !== courier.id) {
            return res.status(403).json({ message: "You are not authorized to update this letter" });
        }
        }

        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data: {
            status: "Delivered",
            deliveredAt: new Date(),
            podImagePath: podImagePath
        }
        });

        // Update courier stats
        if (updatedLetter.courierId) {
        await prisma.courier.update({
            where: { id: updatedLetter.courierId },
            data: {
            activeTasks: { decrement: 1 },
            completedDeliveries: { increment: 1 }
            }
        });
        }

        // Create timeline entry
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: "Delivered",
            description: "Letter delivered successfully (POD uploaded)",
            userId: BigInt(req.user.id)
        }
        });

        // Notify the creator
        await prisma.notification.create({
        data: {
            userId: updatedLetter.createdById,
            type: "success",
            title: "Letter Delivered",
            message: `Your letter ${updatedLetter.trackingId} has been delivered.`,
            letterId: updatedLetter.id
        }
        });

        // Notify Admin
        await notifyAdmins(
        "Letter Delivered",
        `Letter ${updatedLetter.trackingId} has been delivered by ${req.user.name}`,
        updatedLetter.id
        );

        return res.status(200).json({
        message: "Letter marked as delivered",
        letter: {
            id: updatedLetter.id.toString(),
            trackingId: updatedLetter.trackingId,
            status: updatedLetter.status,
            deliveredAt: updatedLetter.deliveredAt,
            podImagePath: updatedLetter.podImagePath
        }
        });
    } catch (err) {
        logger.error("Delivery Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message
        });
    }
    };

    export const mark_undelivered = async (req, res) => {
    const { letter_id } = req.params;
    const { reason } = req.body;

    try {
        const letter = await prisma.letter.findUnique({
        where: { id: BigInt(letter_id) }
        });

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        // Authorization: Only assigned courier or Admin
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (!courier || letter.courierId !== courier.id) {
            return res.status(403).json({ message: "You are not authorized to update this letter" });
        }
        }

        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data: { status: "Undelivered" }
        });

        // Update courier stats
        if (updatedLetter.courierId) {
        await prisma.courier.update({
            where: { id: updatedLetter.courierId },
            data: { activeTasks: { decrement: 1 } }
        });
        }

        // Create timeline entry
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: "Undelivered",
            description: reason || "Delivery failed",
            userId: BigInt(req.user.id)
        }
        });

        // Notify the creator
        await prisma.notification.create({
        data: {
            userId: updatedLetter.createdById,
            type: "warning",
            title: "Delivery Failed",
            message: `Your letter ${updatedLetter.trackingId} could not be delivered.`,
            letterId: updatedLetter.id
        }
        });

        // Notify Admin
        await notifyAdmins(
        "Delivery Failed",
        `Letter ${updatedLetter.trackingId} delivery failed. Reason: ${reason || 'Not provided'}`,
        updatedLetter.id
        );

        return res.status(200).json({
        message: "Letter marked as undelivered",
        letter: {
            id: updatedLetter.id.toString(),
            trackingId: updatedLetter.trackingId,
            status: updatedLetter.status
        }
        });
    } catch (err) {
        logger.error("Undelivered Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message
        });
    }
    };

    export const get_letter = async (req, res) => {
    const { letter_id } = req.params;

    try {
        const letter = await prisma.letter.findUnique({
        where: { id: BigInt(letter_id) },
        include: {
            senderDirectorate: true,
            createdBy: {
            select: { id: true, name: true, email: true }
            },
            approvedBy: {
            select: { id: true, name: true }
            },
            courier: true,
            timelines: {
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                select: { name: true }
                }
            }
            }
        }
        });

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        // Authorization: Courier can only see their assigned letters
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (!courier || letter.courierId !== courier.id) {
            return res.status(403).json({ message: "You are not authorized to view this letter" });
        }
        }

        return res.status(200).json({
        letter: {
            ...letter,
            id: letter.id.toString(),
            senderDirectorateId: letter.senderDirectorateId.toString(),
            createdById: letter.createdById.toString(),
            courierId: letter.courierId?.toString(),
            approvedById: letter.approvedById?.toString(),
            senderDirectorate: letter.senderDirectorate
            ? {
                ...letter.senderDirectorate,
                id: letter.senderDirectorate.id.toString()
            }
            : null,
            createdBy: letter.createdBy
            ? {
                ...letter.createdBy,
                id: letter.createdBy.id.toString()
            }
            : null,
            approvedBy: letter.approvedBy
            ? {
                ...letter.approvedBy,
                id: letter.approvedBy.id.toString()
            }
            : null,
            courier: letter.courier
            ? {
                ...letter.courier,
                id: letter.courier.id.toString()
            }
            : null,
            timelines: letter.timelines.map((t) => ({
            ...t,
            id: t.id.toString(),
            letterId: t.letterId.toString(),
            userId: t.userId?.toString()
            }))
        }
        });
    } catch (err) {
        logger.error("Get Letter Error:", err);
        return res.status(500).json({
        message: "Internal Server Error",
        error: err.message
        });
    }
    };

    export const get_letters = async (req, res) => {
    try {
        const { status, priority, directorate_id, page = 1, limit = 20 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (directorate_id) where.senderDirectorateId = BigInt(directorate_id);

        // If user is Courier, only show their assigned letters
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (courier) {
            where.courierId = courier.id;
        } else {
            return res.status(200).json({
            letters: [],
            pagination: { page: pageNum, limit: limitNum, total: 0, pages: 1 }
            });
        }
        }

        const [letters, total] = await Promise.all([
        prisma.letter.findMany({
            where,
            include: {
            senderDirectorate: true,
            courier: {
                select: { id: true, name: true }
            }
            },
            orderBy: { createdAt: "desc" },
            skip: (pageNum - 1) * limitNum,
            take: limitNum
        }),
        prisma.letter.count({ where })
        ]);

        return res.status(200).json({
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.max(1, Math.ceil(total / limitNum))
        },
        letters: letters.map((l) => ({
            ...l,
            id: l.id.toString(),
            senderDirectorateId: l.senderDirectorateId.toString(),
            createdById: l.createdById.toString(),
            courierId: l.courierId?.toString(),
            approvedById: l.approvedById?.toString(),
            senderDirectorate: l.senderDirectorate
            ? {
                ...l.senderDirectorate,
                id: l.senderDirectorate.id.toString()
            }
            : null,
            courier: l.courier
            ? {
                ...l.courier,
                id: l.courier.id.toString()
            }
            : null
        }))
        });
    } catch (err) {
        logger.error("Get Letters Error:", err);
        return res.status(500).json({ error: err.message });
    }
    };

    export const update_letter_status_generic = async (req, res) => {
    const { letter_id } = req.params;
    const { status, notes } = req.body;

    try {
        const letter = await prisma.letter.findUnique({
        where: { id: BigInt(letter_id) }
        });

        if (!letter) {
        return res.status(404).json({ message: "Letter not found" });
        }

        // Role check
        if (req.user.role === "Courier") {
        const courier = await prisma.courier.findFirst({ where: { userId: BigInt(req.user.id) } });
        if (!courier || letter.courierId !== courier.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }
        }

        let backendStatus = status;
        if (status === 'completed') backendStatus = 'Delivered';
        if (status === 'returned') backendStatus = 'Undelivered';

        const data = {};
        if (backendStatus) data.status = backendStatus;
        if (notes) data.notes = notes;
        if (backendStatus === 'Delivered') data.deliveredAt = new Date();

        const updatedLetter = await prisma.letter.update({
        where: { id: BigInt(letter_id) },
        data
        });

        // Timeline
        await prisma.letterTimeline.create({
        data: {
            letterId: BigInt(letter_id),
            status: backendStatus || "Updated",
            description: `Status updated to ${backendStatus}. Notes: ${notes || 'None'}`,
            userId: BigInt(req.user.id)
        }
        });

        return res.status(200).json({ success: true, data: { ...updatedLetter, id: updatedLetter.id.toString() } });
    } catch (err) {
        logger.error("Generic Update Error:", err);
        res.status(500).json({ error: err.message });
    }
    };
