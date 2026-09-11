import express from 'express';
import {
    get_users,
    create_user,
    update_user,
    set_user_disabled,
    reset_user_password,
} from '../controllers/user.controller.js';
import { protect, restrictTo } from '../middleware/protect.js';

const router = express.Router();

// Management-only account management (see types/api.ts's UserRole
// comment on the Client side for why this isn't in API_DOCUMENTATION.md)
router.use(protect, restrictTo('Management'));

router.get('/', get_users);
router.post('/', create_user);
router.patch('/:id', update_user);
router.patch('/:id/disable', set_user_disabled);
router.post('/:id/reset-password', reset_user_password);

export default router;
