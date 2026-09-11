import express from 'express';
import {
    get_schedules,
    get_schedule_by_id,
    update_schedule
} from '../controllers/schedule.controller.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

router.get('/', protect, get_schedules);
router.post('/create', protect, (req, res) => res.status(501).json({ message: "Not implemented" })); // Placeholder
router.post('/submit', protect, (req, res) => res.status(501).json({ message: "Not implemented" })); // Placeholder
router.get('/:id', protect, get_schedule_by_id);
router.get('/:id/verify', protect, (req, res) => res.status(200).json({ verified: true })); // Placeholder
router.get('/:id/reject', protect, (req, res) => res.status(200).json({ rejected: true })); // Placeholder
router.patch('/:id', protect, update_schedule);

export default router;
