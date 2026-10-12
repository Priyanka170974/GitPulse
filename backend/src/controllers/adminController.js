import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';
import { Repository } from '../models/Repository.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { fetchRateLimitStatus } from '../services/githubService.js';

/**
 * GET /api/admin/users  (protected + admin)
 * Passwords are never selected, so they can not leak through this route.
 */
export const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const search = String(req.query.search || '').trim();

  const filter = {};
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const ids = users.map((u) => u._id);
  const repoCounts = await Repository.aggregate([
    { $match: { userId: { $in: ids } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(repoCounts.map((r) => [r._id.toString(), r.count]));

  return sendSuccess(res, {
    data: {
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        repositories: countMap.get(u._id.toString()) || 0,
      })),
    },
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

/**
 * GET /api/admin/statistics  (protected + admin)
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    adminUsers,
    totalRepositories,
    totalAnalyses,
    recentUsers,
    recentAnalyses,
    recentRepositories,
    topRepositories,
    pulseBuckets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'admin' }),
    Repository.countDocuments(),
    AnalysisHistory.countDocuments(),
    User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
    AnalysisHistory.find()
      .populate('userId', 'name email')
      .populate('repositoryId', 'fullName')
      .sort({ analyzedAt: -1 })
      .limit(8)
      .lean(),
    Repository.find().select('fullName stars lastAnalyzedAt activity.pulseScore').sort({ lastAnalyzedAt: -1 }).limit(6).lean(),
    Repository.find().select('fullName stars forks contributorCount').sort({ stars: -1 }).limit(5).lean(),
    Repository.aggregate([
      { $group: { _id: '$activity.pulseLabel', count: { $sum: 1 } } },
    ]),
  ]);

  const averages = await Repository.aggregate([
    {
      $group: {
        _id: null,
        avgStars: { $avg: '$stars' },
        avgForks: { $avg: '$forks' },
        avgPulse: { $avg: '$activity.pulseScore' },
        totalStars: { $sum: '$stars' },
      },
    },
  ]);

  const githubRateLimit = await fetchRateLimitStatus();

  return sendSuccess(res, {
    data: {
      totals: { users: totalUsers, admins: adminUsers, repositories: totalRepositories, analyses: totalAnalyses },
      averages: {
        avgStars: Math.round(averages[0]?.avgStars || 0),
        avgForks: Math.round(averages[0]?.avgForks || 0),
        avgPulse: Math.round(averages[0]?.avgPulse || 0),
        totalStars: averages[0]?.totalStars || 0,
      },
      pulseDistribution: (pulseBuckets || []).map((b) => ({ label: b._id || 'unknown', count: b.count })),
      recentUsers: recentUsers.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      })),
      recentAnalyses: recentAnalyses
        .filter((a) => a.repositoryId)
        .map((a) => ({
          id: a._id,
          repository: a.repositoryId?.fullName || 'deleted repository',
          user: a.userId?.name || a.userId?.email || 'deleted user',
          source: a.source,
          stars: a.snapshot?.stars ?? 0,
          pulseScore: a.snapshot?.pulseScore ?? 0,
          analyzedAt: a.analyzedAt,
        })),
      recentRepositories: recentRepositories.map((r) => ({
        id: r._id,
        fullName: r.fullName,
        stars: r.stars,
        pulseScore: r.activity?.pulseScore || 0,
        lastAnalyzedAt: r.lastAnalyzedAt,
      })),
      topRepositories: topRepositories.map((r) => ({
        id: r._id,
        fullName: r.fullName,
        stars: r.stars,
        forks: r.forks,
        contributors: r.contributorCount,
      })),
      github: githubRateLimit,
    },
  });
});

/**
 * PATCH /api/admin/users/:id/role  (protected + admin)
 * Lets an administrator promote/demote an account without touching the database by hand.
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body || {};

  if (!['user', 'admin'].includes(role)) {
    throw ApiError.badRequest('Role must be either "user" or "admin".', { field: 'role' });
  }
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw ApiError.badRequest('That user id is not valid.', { field: 'id' });
  }

  const user = await User.findByIdAndUpdate(req.params.id, { $set: { role } }, { new: true }).select('name email role');
  if (!user) throw ApiError.notFound('That user does not exist.');

  if (user._id.toString() === req.user.userId && role !== 'admin') {
    throw ApiError.badRequest('You cannot remove your own administrator role.');
  }

  return sendSuccess(res, {
    data: { user },
    message: `${user.name} is now ${role === 'admin' ? 'an administrator' : 'a standard user'}.`,
  });
});

export default { getUsers, getStatistics, updateUserRole };