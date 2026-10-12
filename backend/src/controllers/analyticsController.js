import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import repositoryService from '../services/repositoryService.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { THRESHOLDS, describeCloneFreshness } from '../services/analyticsService.js';

/**
 * GET /api/repositories/:id/analytics  (protected)
 *
 * Returns a view model built from the stored document:
 *   • headline metrics
 *   • the four GitPulse-defined activity indicators (+ their thresholds)
 *   • generated insights
 *   • chart-ready series
 *   • change vs. the previous snapshot
 *
 * The stored data itself was produced by analyticsService at analyze /
 * re-analyze time — this endpoint never fakes anything.
 */
export const getRepositoryAnalytics = asyncHandler(async (req, res) => {
  const repository = await repositoryService.getRepositoryForUser({
    userId: req.user.userId,
    repositoryId: req.params.id,
  });

  /* The snapshot of the *current* run is written with a timestamp slightly
     after repository.lastAnalyzedAt, so `$lt` always returns the previous run. */
  const previousSnapshot = await AnalysisHistory.findOne({
    repositoryId: repository._id,
    userId: req.user.userId,
    analyzedAt: { $lt: repository.lastAnalyzedAt },
  })
    .sort({ analyzedAt: -1 })
    .lean();

  const current = {
    stars: repository.stars,
    forks: repository.forks,
    watchers: repository.watchers,
    openIssues: repository.openIssues,
    contributors: repository.contributorCount,
    commits30Days: repository.commitStats?.commits30Days || 0,
    pulseScore: repository.activity?.pulseScore || 0,
  };

  const prev = previousSnapshot?.snapshot;
  const delta = prev
    ? {
        stars: current.stars - (prev.stars ?? 0),
        forks: current.forks - (prev.forks ?? 0),
        watchers: current.watchers - (prev.watchers ?? 0),
        openIssues: current.openIssues - (prev.openIssues ?? 0),
        contributors: current.contributors - (prev.contributors ?? 0),
        commits30Days: current.commits30Days - (prev.commits30Days ?? 0),
        pulseScore: current.pulseScore - (prev.pulseScore ?? 0),
        previousAnalyzedAt: previousSnapshot.analyzedAt,
      }
    : null;

  return sendSuccess(res, {
    data: {
      repository: {
        id: repository._id,
        fullName: repository.fullName,
        owner: repository.owner,
        repoName: repository.repoName,
        description: repository.description,
        repoUrl: repository.repoUrl,
        homepage: repository.homepage,
        topics: repository.topics,
        license: repository.license,
        defaultBranch: repository.defaultBranch,
        sizeKb: repository.sizeKb,
        createdOnGitHub: repository.createdOnGitHub,
        githubUpdatedAt: repository.githubUpdatedAt,
        lastPushedAt: repository.lastPushedAt,
        lastAnalyzedAt: repository.lastAnalyzedAt,
        previousAnalysisAt: repository.previousAnalysisAt,
        analysisCount: repository.analysisCount,
      },
      metrics: {
        stars: repository.stars,
        forks: repository.forks,
        watchers: repository.watchers,
        openIssues: repository.openIssues,
        closedIssues: repository.closedIssues,
        openPullRequests: repository.openPullRequests,
        closedPullRequests: repository.closedPullRequests,
        contributors: repository.contributorCount,
        primaryLanguage: repository.chartData?.languageDistribution?.[0]?.language || 'Not detected',
        primaryLanguageShare: repository.chartData?.languageDistribution?.[0]?.percentage || 0,
        languageCount: repository.chartData?.languageDistribution?.length || 0,
        commitsTotal: repository.commitStats?.total || 0,
        commits30Days: repository.commitStats?.commits30Days || 0,
        commits7Days: repository.commitStats?.commits7Days || 0,
        activeDays30: repository.commitStats?.activeDays30 || 0,
        firstCommitAt: repository.commitStats?.firstCommitAt || null,
        lastCommitAt: repository.commitStats?.lastCommitAt || null,
      },
      activity: {
        pulseScore: repository.activity?.pulseScore || 0,
        pulseLabel: repository.activity?.pulseLabel || 'unknown',
        indicators: repository.activity?.indicators || [],
        definitions: THRESHOLDS,
        disclaimer:
          'Pulse score and High / Moderate / Low labels are calculated by GitPulse from real GitHub data. They are not official GitHub metrics.',
      },
      insights: repository.insights || [],
      charts: repository.chartData || {},
      originInfo: repository.originInfo || null,
      cloneAnalytics: describeCloneFreshness(repository.cloneAnalytics),
      commits: (repository.recentCommits || []).slice(0, 12),
      contributors: (repository.contributors || []).slice(0, 10),
      delta,
    },
  });
});

export default { getRepositoryAnalytics };