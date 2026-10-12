import { Router } from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

// GET /api/analytics/repositories/:id/analytics
router.get('/repositories/:id/analytics', analyticsController.getRepositoryAnalytics);

export default router;