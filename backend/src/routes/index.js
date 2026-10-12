import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import authRoutes from './authRoutes.js';
import repositoryRoutes from './repositoryRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';
import adminRoutes from './adminRoutes.js';
import { THRESHOLDS, WEIGHTS } from '../services/analyticsService.js';
import { checkTokenAccess } from '../services/githubService.js';
import { isDbConnected } from '../config/db.js';
import { config } from '../config/env.js';

const router = Router();

const API_VERSION = '1.0.0';

/**
 * Public health check.
 *
 * `?verifyToken=1` additionally asks GitHub whether the configured token is
 * still accepted. The response contains only non-secret facts (valid, which
 * account it belongs to, remaining rate limit) — never the token itself.
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const wantsVerification = req.query.verifyToken === '1' || req.query.verifyToken === 'true';

    const githubToken = wantsVerification
      ? await checkTokenAccess()
      : { configured: Boolean(config.githubToken), verified: false };

    res.status(200).json({
      success: true,
      data: {
        service: 'GitPulse API',
        version: API_VERSION,
        environment: config.env,
        database: isDbConnected() ? 'connected' : 'disconnected',
        githubTokenConfigured: Boolean(config.githubToken),
        // Only non-secret facts — safe to log, never contains the token.
        githubToken,
        uptimeSeconds: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  }),
);

/** Public metadata: documents how GitPulse calculates its indicators. */
router.get('/meta', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: API_VERSION,
      indicators: THRESHOLDS,
      weights: WEIGHTS,
      disclaimer:
        'Pulse score and activity labels are GitPulse-defined analytics derived from public GitHub data. They are not official GitHub metrics.',
    },
  });
});

router.use('/auth', authRoutes);
router.use('/repositories', repositoryRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/admin', adminRoutes);

export default router;