import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = Router();

// Admin endpoints need BOTH a valid JWT and the admin role.
router.use(protect, admin);

// GET /api/admin/users
router.get('/users', adminController.getUsers);

// GET /api/admin/statistics
router.get('/statistics', adminController.getStatistics);

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', adminController.updateUserRole);

export default router;