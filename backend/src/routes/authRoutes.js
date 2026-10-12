import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as authController from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/* Brute-force protection on credential endpoints (in-memory, per IP). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this device. Please wait 15 minutes and try again.',
    code: 'rate_limited',
  },
});

// POST /api/auth/register
router.post('/register', authLimiter, authController.register);

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// GET /api/auth/me
router.get('/me', protect, authController.getMe);

// PUT /api/auth/profile
router.put('/profile', protect, authController.updateProfile);

// POST /api/auth/logout
router.post('/logout', protect, authController.logout);

export default router;