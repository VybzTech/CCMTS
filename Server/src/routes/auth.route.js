import express from 'express';
import { signup, login, user, changePassword } from '../controllers/auth.controller.js';
import { protect } from '../middleware/protect.js';


const router = express.Router()

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, user)
router.post('/change-password', protect, changePassword)


export default router;