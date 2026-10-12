import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as repositoryController from '../controllers/repositoryController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

/** Every repository route requires a valid JWT. */
router.use(protect);

/* GitHub allows only 60 req/h without a token — protect the server as well. */
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'You are analyzing too quickly. Wait a minute before analyzing another repository.',
    code: 'rate_limited',
  },
});

// POST /api/repositories/analyze
router.post('/analyze', analyzeLimiter, repositoryController.analyzeRepository);

// GET /api/repositories/compare?a=<id>&b=<id>  (declared before /:id)
router.get('/compare', repositoryController.compareRepositories);

// GET /api/repositories/summary
router.get('/summary', repositoryController.getSummary);

// GET /api/repositories?search=&sort=&language=&activity=
router.get('/', repositoryController.getRepositories);

// GET /api/repositories/:id
router.get('/:id', repositoryController.getRepository);

// POST /api/repositories/:id/reanalyze
router.post('/:id/reanalyze', analyzeLimiter, repositoryController.reanalyzeRepository);

// DELETE /api/repositories/:id
router.delete('/:id', repositoryController.deleteRepository);

// GET /api/repositories/:id/history
router.get('/:id/history', repositoryController.getRepositoryHistory);

export default router;