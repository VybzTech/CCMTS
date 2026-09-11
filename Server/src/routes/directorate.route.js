import express from 'express';
import {
    create_directorate,
    get_directorates,
    get_directorate_by_id,
    update_directorate,
    delete_directorate
} from '../controllers/directorate.controller.js';
import { protect } from '../middleware/protect.js';

const router = express.Router();

// Get all directorates
router.get('/', protect, get_directorates);

// Get directorate by ID
router.get('/:directorate_id', protect, get_directorate_by_id);

// Create a new directorate (Admin only)
router.post('/', protect, create_directorate);

// Update directorate
router.patch('/:directorate_id', protect, update_directorate);

// Delete directorate
router.delete('/:directorate_id', protect, delete_directorate);

export default router;
