import express from 'express';
import { login, user, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/protect.js';


const router = express.Router()

// NOTE: POST /signup was removed deliberately. It was public and
// unauthenticated, and its body accepted `role`, so anyone able to reach
// the API could mint themselves a Management account. Account creation
// lives at POST /api/v1/users, which is behind protect + restrictTo(
// 'Management'). Do not re-add an unauthenticated variant.

router.post('/login', login);
router.get('/me', protect, user)
router.post('/change-password', protect, changePassword)


export default router;