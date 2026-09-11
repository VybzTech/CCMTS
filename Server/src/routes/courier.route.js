import express from 'express';
import {
    create_courier,
    get_couriers,
    get_courier_by_id,
    update_courier_availability,
    update_courier_performance,
    acknowledge_pod
} from '../controllers/courier.controller.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

// Create a new courier
router.post('/', protect, create_courier);

// Get all available couriers
router.get('/', protect, get_couriers);

// Get courier by ID
router.get('/:courier_id', protect, get_courier_by_id);

// Update courier availability
router.patch('/:courier_id/availability', protect, update_courier_availability);

// Update courier performance/stats after delivery
router.patch('/:courier_id/performance', protect, update_courier_performance);

// Acknowledge POD (from Mobile App)
router.post('/acknowledge-pod', protect, acknowledge_pod);

export default router;
