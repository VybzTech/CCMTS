import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../config/prisma.js';

// PODs are grouped by the courier the letter is assigned to (not by
// whoever happened to click upload - an Admin can upload on a courier's
// behalf, see letter.route.js's restrictTo("Courier", "Admin")), so the
// folder reflects whose deliveries the evidence belongs to.
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const letter = await prisma.letter.findUnique({
                where: { id: BigInt(req.params.letter_id) },
                select: { courierId: true }
            });

            const courierSegment = letter?.courierId ? letter.courierId.toString() : 'unassigned';
            const uploadPath = path.join('uploads', 'pod', courierSegment);

            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const uploadPod = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
