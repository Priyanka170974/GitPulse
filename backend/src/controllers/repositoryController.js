import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';
import repositoryService from '../services/repositoryService.js';
import { buildHistoryTrend } from '../services/analyticsService.js';

/**
 * POST /api/repositories/analyze  (protected)
 * Body: { repoUrl: "https://github.com/owner/repo" }
 */
export const analyzeRepository = asyncHandler(async (req, res) => {
  const { repoUrl } = req.body || {};
  if (!repoUrl) {
    throw ApiError.badRequest('Paste a GitHub repository URL to analyze.', { field: 'repoUrl' });
  }

  const result = await repositoryService.analyzeRepository({
    userId: req.user.userId,
    repoUrl,
  });

  return sendSuccess(res, {
    data: {
      repository: result.repository,
      deltas: result.deltas,
      created: result.created,
      refreshed: result.refreshed,
    },
    status: result.created ? 201 : 200,
    message: result.created
      ? `Analyzed ${result.repository.fullName} successfully.`
      : `Refreshed ${result.repository.fullName} with the latest data from GitHub.`,
  });
});

/**
 * POST /api/repositories/:id/reanalyze  (protected)
 * Always performs a fresh GitHub API call — never returns cached MongoDB data.
 */
export const reanalyzeRepository = asyncHandler(async (req, res) => {
  const result = await repositoryService.reanalyzeRepository({
    userId: req.user.userId,
    repositoryId: req.params.id,
  });

  return sendSuccess(res, {
    data: {
      repository: result.repository,
      deltas: result.deltas,
    },
    message: `Refreshed ${result.repository.fullName} with the latest data from GitHub.`,
  });
});

/**
 * GET /api/repositories  (protected)
 * Query: ?search=&sort=&language=&activity=
 */
export const getRepositories = asyncHandler(async (req, res) => {
  const { search = '', sort = 'recent', language = 'all', activity = 'all' } = req.query || {};

  const repositories = await repositoryService.listRepositories({
    userId: req.user.userId,
    search: String(search),
    sort: String(sort),
    language: String(language),
    activity: String(activity),
  });

  const languages = await repositoryService.getLanguageFacets({ userId: req.user.userId });

  return sendSuccess(res, {
    data: { repositories, total: repositories.length, languages },
  });
});

/**
 * GET /api/repositories/summary  (protected)
 * Aggregate numbers for the dashboard stat cards (MongoDB aggregation pipeline).
 * Declared before /:id so "summary" is not treated as a repository id.
 */
export const getSummary = asyncHandler(async (req, res) => {
  const summary = await repositoryService.getUserSummary({ userId: req.user.userId });
  return sendSuccess(res, { data: { summary } });
});

/**
 * GET /api/repositories/compare?a=<id>&b=<id>  (protected)
 * Declared before /:id so "compare" is not swallowed by the id route.
 */
export const compareRepositories = asyncHandler(async (req, res) => {
  const { a, b } = req.query || {};
  const { a: first, b: second } = await repositoryService.compareRepositories({
    userId: req.user.userId,
    firstId: a,
    secondId: b,
  });

  const buildSide = (doc) => ({
    id: doc._id,
    fullName: doc.fullName,
    description: doc.description,
    repoUrl: doc.repoUrl,
    stars: doc.stars,
    forks: doc.forks,
    watchers: doc.watchers,
    openIssues: doc.openIssues,
    closedIssues: doc.closedIssues,
    openPullRequests: doc.openPullRequests,
    contributors: doc.contributorCount,
    primaryLanguage: doc.chartData?.languageDistribution?.[0]?.language || 'Not detected',
    languageCount: doc.chartData?.languageDistribution?.length || 0,
    languages: (doc.chartData?.languageDistribution || []).slice(0, 6),
    commits30Days: doc.commitStats?.commits30Days || 0,
    commits7Days: doc.commitStats?.commits7Days || 0,
    commitsTotal: doc.commitStats?.total || 0,
    pulseScore: doc.activity?.pulseScore || 0,
    pulseLabel: doc.activity?.pulseLabel || 'unknown',
    indicators: doc.activity?.indicators || [],
    lastAnalyzedAt: doc.lastAnalyzedAt,
    createdOnGitHub: doc.createdOnGitHub,
  });

  return sendSuccess(res, {
    data: {
      repositories: { a: buildSide(first), b: buildSide(second) },
      comparison: [
        { key: 'stars', label: 'Stars', a: first.stars, b: second.stars, unit: 'count' },
        { key: 'forks', label: 'Forks', a: first.forks, b: second.forks, unit: 'count' },
        { key: 'watchers', label: 'Watchers', a: first.watchers, b: second.watchers, unit: 'count' },
        { key: 'openIssues', label: 'Open issues', a: first.openIssues, b: second.openIssues, unit: 'count' },
        { key: 'contributors', label: 'Contributors', a: first.contributorCount, b: second.contributorCount, unit: 'count' },
        { key: 'commits30Days', label: 'Commits (30 days)', a: first.commitStats?.commits30Days || 0, b: second.commitStats?.commits30Days || 0, unit: 'count' },
        { key: 'pulseScore', label: 'GitPulse score', a: first.activity?.pulseScore || 0, b: second.activity?.pulseScore || 0, unit: 'score' },
      ],
      note: 'GitPulse reports factual metrics only — it does not declare one repository better than another.',
    },
  });
});

/**
 * GET /api/repositories/:id  (protected)
 */
export const getRepository = asyncHandler(async (req, res) => {
  const repository = await repositoryService.getRepositoryForUser({
    userId: req.user.userId,
    repositoryId: req.params.id,
  });

  return sendSuccess(res, { data: { repository } });
});

/**
 * DELETE /api/repositories/:id  (protected)
 */
export const deleteRepository = asyncHandler(async (req, res) => {
  const repository = await repositoryService.deleteRepositoryForUser({
    userId: req.user.userId,
    repositoryId: req.params.id,
  });

  return sendSuccess(res, {
    data: { id: repository._id, fullName: repository.fullName },
    message: `${repository.fullName} was removed from your library along with its analysis history.`,
  });
});

/**
 * GET /api/repositories/:id/history  (protected)
 */
export const getRepositoryHistory = asyncHandler(async (req, res) => {
  const history = await repositoryService.getHistoryForUser({
    userId: req.user.userId,
    repositoryId: req.params.id,
  });

  const trend = buildHistoryTrend(history);
  const first = trend[0];
  const latest = trend[trend.length - 1];

  return sendSuccess(res, {
    data: {
      history: history.map((h) => ({
        id: h._id,
        source: h.source,
        analyzedAt: h.analyzedAt,
        snapshot: h.snapshot,
      })),
      trend,
      growth:
        first && latest && trend.length > 1
          ? {
              stars: latest.stars - first.stars,
              forks: latest.forks - first.forks,
              openIssues: latest.openIssues - first.openIssues,
              contributors: latest.contributors - first.contributors,
              pulseScore: latest.pulseScore - first.pulseScore,
              snapshots: trend.length,
            }
          : null,
    },
  });
});

export default {
  analyzeRepository,
  reanalyzeRepository,
  getRepositories,
  getSummary,
  getRepository,
  deleteRepository,
  getRepositoryHistory,
  compareRepositories,
};