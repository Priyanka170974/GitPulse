import mongoose from 'mongoose';
import { Repository } from '../models/Repository.js';
import { AnalysisHistory } from '../models/AnalysisHistory.js';
import { parseRepositoryUrl, fetchRepositoryData } from './githubService.js';
import { computeAnalytics, computeCommitStats } from './analyticsService.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Repository service — the business layer between controllers and MongoDB.
 * Every function here is user-scoped: the `userId` of the authenticated
 * request is part of every query, which guarantees data isolation.
 */

/* ------------------------------ helpers ---------------------------- */

function assertObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw ApiError.badRequest('That repository id is not valid.', { field: 'id', received: id });
  }
}

/**
 * Difference between the data already stored and the data just fetched from
 * GitHub. Used for the "change since your previous analysis" insight.
 */
function computeDeltas(previousDoc, rawData) {
  if (!previousDoc) {
    return { hasPrevious: false };
  }
  const previousAnalyzedAtLabel = new Date(previousDoc.lastAnalyzedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const previousCommitStats = previousDoc.commitStats || {};
  const freshCommitStats = computeCommitStats(rawData.recentCommits || []);

  return {
    hasPrevious: true,
    previousAnalyzedAt: previousDoc.lastAnalyzedAt,
    previousAnalyzedAtLabel,
    stars: (rawData.stars ?? 0) - (previousDoc.stars ?? 0),
    forks: (rawData.forks ?? 0) - (previousDoc.forks ?? 0),
    watchers: (rawData.watchers ?? 0) - (previousDoc.watchers ?? 0),
    openIssues: (rawData.openIssues ?? 0) - (previousDoc.openIssues ?? 0),
    contributors: (rawData.contributors?.length ?? 0) - (previousDoc.contributorCount ?? 0),
    commits30Days: (freshCommitStats.commits30Days ?? 0) - (previousCommitStats.commits30Days ?? 0),
  };
}

/** Writes the immutable snapshot used by the History page. */
async function saveSnapshot(repository, source) {
  const indicator = (key) =>
    repository.activity?.indicators?.find((i) => i.key === key)?.level || 'unknown';

  await AnalysisHistory.create({
    repositoryId: repository._id,
    userId: repository.userId,
    source,
    snapshot: {
      stars: repository.stars,
      forks: repository.forks,
      watchers: repository.watchers,
      openIssues: repository.openIssues,
      closedIssues: repository.closedIssues,
      openPullRequests: repository.openPullRequests,
      contributors: repository.contributorCount,
      primaryLanguage: repository.chartData?.languageDistribution?.[0]?.language || 'Not detected',
      languageCount: repository.chartData?.languageDistribution?.length || 0,
      commitsTotal: repository.commitStats?.total || 0,
      commits30Days: repository.commitStats?.commits30Days || 0,
      commits7Days: repository.commitStats?.commits7Days || 0,
      pulseScore: repository.activity?.pulseScore || 0,
      pulseLabel: repository.activity?.pulseLabel || 'unknown',
      commitActivity: indicator('commitActivity'),
      contributorActivity: indicator('contributorActivity'),
      issueActivity: indicator('issueActivity'),
      updateFrequency: indicator('updateFrequency'),
    },
    analyzedAt: new Date(),
  });
}

/**
 * Cache isolation guard — the last line of defence before clone data is
 * written to MongoDB.
 *
 * Clone statistics belong to exactly one repository. If the payload key and
 * the repository being saved disagree (even though `buildCloneAnalytics`
 * already checks this upstream), the numbers are dropped and replaced with an
 * explicit "unavailable / cache_mismatch" block rather than being stored
 * against the wrong repository.
 *
 * Exported so the behaviour can be tested directly.
 */
export function guardCloneCacheIsolation(cloneAnalytics, fullName) {
  const payload = { ...(cloneAnalytics || {}) };

  if (!fullName) return payload;

  const key = payload.repositoryKey || null;
  const resolvedKey = payload.resolvedKey || null;

  // Legacy rows saved before this key existed: backfill it from the document
  // itself, because the block physically lives inside that repository.
  if (!key) {
    payload.repositoryKey = fullName;
    return payload;
  }

  // Matches directly, or through GitHub's own rename/transfer resolution
  // (requested `facebook/react` served as the canonical `react/react`).
  const servesThisRepo = key === fullName || (resolvedKey && resolvedKey === fullName);

  if (!servesThisRepo) {
    return {
      available: false,
      repositoryKey: fullName,
      reason: 'cache_mismatch',
      message:
        'Stored clone statistics belonged to a different repository, so they were discarded instead of being shown here.',
      httpStatus: null,
      githubMessage: null,
      totalClones: null,
      uniqueCloners: null,
      daily: [],
      windowDays: payload.windowDays || 14,
      reportedDays: 0,
      filledDays: payload.windowDays || 14,
      source: null,
    };
  }

  return payload;
}

/** Writes every GitHub-derived field onto the mongoose document. */
function applyData(doc, rawData, analytics) {
  doc.owner = rawData.owner;
  doc.repoName = rawData.repoName;
  doc.fullName = rawData.fullName;
  doc.repoUrl = rawData.repoUrl;
  doc.homepage = rawData.homepage;
  doc.description = rawData.description;
  doc.stars = rawData.stars;
  doc.forks = rawData.forks;
  doc.watchers = rawData.watchers;
  doc.openIssues = rawData.openIssues;
  doc.closedIssues = rawData.closedIssues;
  doc.openPullRequests = rawData.openPullRequests;
  doc.closedPullRequests = rawData.closedPullRequests;
  doc.defaultBranch = rawData.defaultBranch;
  doc.topics = rawData.topics;
  doc.license = rawData.license;
  doc.sizeKb = rawData.sizeKb;
  doc.createdOnGitHub = rawData.createdOnGitHub;
  doc.githubUpdatedAt = rawData.githubUpdatedAt;
  doc.lastPushedAt = rawData.lastPushedAt;
  doc.contributorCount = rawData.contributors.length;
  doc.contributors = rawData.contributors.slice(0, 100);
  doc.recentCommits = rawData.recentCommits.slice(0, 100);
  doc.commitStats = analytics.commitStats;
  doc.activity = {
    pulseScore: analytics.activity.pulseScore,
    pulseLabel: analytics.activity.pulseLabel,
    indicators: analytics.activity.indicators,
  };
  doc.insights = analytics.insights;
  doc.chartData = analytics.chartData;
  // Origin detection is deliberately independent of clone analytics.
  doc.originInfo = rawData.origin || null;
  doc.cloneAnalytics = guardCloneCacheIsolation(
    { ...analytics.cloneAnalytics, fetchedAt: new Date() },
    rawData.fullName,
  );
  doc.lastError = null;
  return doc;
}

/* --------------------------- public API ---------------------------- */

/**
 * POST /api/repositories/analyze
 * Fetches live GitHub data, stores it, and returns the full analytics object.
 * If the user already tracks this repository the record is refreshed in place.
 */
export async function analyzeRepository({ userId, repoUrl }) {
  const parsed = parseRepositoryUrl(repoUrl);
  const rawData = await fetchRepositoryData(parsed.owner, parsed.repoName);

  const existing = await Repository.findOne({ userId, fullName: rawData.fullName });

  const deltas = computeDeltas(existing ? existing.toObject() : null, rawData);
  const analytics = computeAnalytics(rawData, { previous: existing, deltas });

  let doc;
  let created;

  if (existing) {
    existing.previousAnalysisAt = existing.lastAnalyzedAt;
    applyData(existing, rawData, analytics);
    existing.analysisCount = (existing.analysisCount || 1) + 1;
    doc = await existing.save();
    created = false;
  } else {
    doc = new Repository({ userId, fullName: rawData.fullName });
    applyData(doc, rawData, analytics);
    doc.lastAnalyzedAt = new Date();
    doc.analysisCount = 1;
    try {
      doc = await doc.save();
      created = true;
    } catch (error) {
      // Unique index race (same user, same repo, two clicks) → fall back to update.
      if (error?.code === 11000) {
        const raced = await Repository.findOne({ userId, fullName: rawData.fullName });
        if (!raced) throw error;
        raced.previousAnalysisAt = raced.lastAnalyzedAt;
        applyData(raced, rawData, analytics);
        raced.analysisCount = (raced.analysisCount || 1) + 1;
        doc = await raced.save();
        created = false;
      } else {
        throw error;
      }
    }
  }

  await saveSnapshot(doc, created ? 'analyze' : 'reanalyze');

  return {
    repository: doc,
    created,
    refreshed: !created,
    deltas,
  };
}

/**
 * POST /api/repositories/:id/reanalyze
 * Always re-calls the GitHub API — MongoDB data is never simply re-sent.
 */
export async function reanalyzeRepository({ userId, repositoryId }) {
  assertObjectId(repositoryId);

  const doc = await Repository.findOne({ _id: repositoryId, userId });
  if (!doc) {
    throw ApiError.notFound(
      'We could not find that repository in your library. It may have been deleted.',
      { repositoryId },
    );
  }

  // Live call — this is the whole point of the re-analyze button.
  const rawData = await fetchRepositoryData(doc.owner, doc.repoName);

  const deltas = computeDeltas(doc.toObject(), rawData);
  const analytics = computeAnalytics(rawData, { previous: doc, deltas });

  doc.previousAnalysisAt = doc.lastAnalyzedAt;
  applyData(doc, rawData, analytics);
  doc.analysisCount = (doc.analysisCount || 1) + 1;
  doc.lastAnalyzedAt = new Date();
  await doc.save();

  await saveSnapshot(doc, 'reanalyze');

  return { repository: doc, created: false, refreshed: true, deltas };
}

/** GET /api/repositories — always scoped to the signed-in user. */
export async function listRepositories({ userId, search = '', sort = 'recent', language = 'all', activity = 'all' }) {
  const query = { userId };

  if (search.trim()) {
    const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { fullName: { $regex: safe, $options: 'i' } },
      { description: { $regex: safe, $options: 'i' } },
      { owner: { $regex: safe, $options: 'i' } },
      { repoName: { $regex: safe, $options: 'i' } },
    ];
  }

  if (activity !== 'all') {
    query['activity.indicators.key'] = 'commitActivity';
    query['activity.indicators'] = {
      $elemMatch: { key: 'commitActivity', level: activity },
    };
  }

  const sortMap = {
    recent: { lastAnalyzedAt: -1 },
    stars: { stars: -1 },
    forks: { forks: -1 },
    contributors: { contributorCount: -1 },
    issues: { openIssues: -1 },
    pulse: { 'activity.pulseScore': -1 },
    name: { fullName: 1 },
  };

  let docs = await Repository.find(query).sort(sortMap[sort] || sortMap.recent);

  if (language !== 'all') {
    docs = docs.filter(
      (d) => (d.chartData?.languageDistribution?.[0]?.language || '').toLowerCase() === language.toLowerCase(),
    );
  }

  return docs;
}

export async function getRepositoryForUser({ userId, repositoryId }) {
  assertObjectId(repositoryId);
  const doc = await Repository.findOne({ _id: repositoryId, userId });
  if (!doc) {
    throw ApiError.notFound('We could not find that repository in your library.', { repositoryId });
  }
  return doc;
}

export async function deleteRepositoryForUser({ userId, repositoryId }) {
  assertObjectId(repositoryId);
  const doc = await Repository.findOneAndDelete({ _id: repositoryId, userId });
  if (!doc) {
    throw ApiError.notFound('We could not find that repository in your library.', { repositoryId });
  }
  await AnalysisHistory.deleteMany({ repositoryId: doc._id, userId });
  return doc;
}

export async function getHistoryForUser({ userId, repositoryId }) {
  const repo = await getRepositoryForUser({ userId, repositoryId });
  return AnalysisHistory.find({ repositoryId: repo._id, userId }).sort({ analyzedAt: -1 });
}

/** Aggregate numbers for the dashboard stat cards. */
export async function getUserSummary({ userId }) {
  const rows = await Repository.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalRepositories: { $sum: 1 },
        totalStars: { $sum: '$stars' },
        totalForks: { $sum: '$forks' },
        totalWatchers: { $sum: '$watchers' },
        totalOpenIssues: { $sum: '$openIssues' },
        totalContributors: { $sum: '$contributorCount' },
        totalAnalyses: { $sum: '$analysisCount' },
        averagePulse: { $avg: '$activity.pulseScore' },
      },
    },
  ]);

  const base = rows[0] || {
    totalRepositories: 0,
    totalStars: 0,
    totalForks: 0,
    totalWatchers: 0,
    totalOpenIssues: 0,
    totalContributors: 0,
    totalAnalyses: 0,
    averagePulse: 0,
  };

  const last7Days = await Repository.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    lastAnalyzedAt: { $gte: new Date(Date.now() - 7 * 86400000) },
  });

  const languages = await Repository.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$chartData.languageDistribution' },
    {
      $group: {
        _id: '$chartData.languageDistribution.language',
        bytes: { $sum: '$chartData.languageDistribution.bytes' },
        color: { $first: '$chartData.languageDistribution.color' },
      },
    },
    { $sort: { bytes: -1 } },
    { $limit: 6 },
  ]);

  const recentActivity = await Repository.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $sort: { lastAnalyzedAt: -1 } },
    { $limit: 5 },
    {
      $project: {
        fullName: 1,
        stars: 1,
        pulseScore: '$activity.pulseScore',
        pulseLabel: '$activity.pulseLabel',
        lastAnalyzedAt: 1,
      },
    },
  ]);

  return {
    ...base,
    averagePulse: Math.round(base.averagePulse || 0),
    analysesLast7Days: last7Days,
    topLanguages: languages.map((l) => ({
      language: l._id,
      bytes: l.bytes,
      color: l.color || '#6366F1',
    })),
    recentActivity,
  };
}

/** Language facets used to build the filter dropdown on My Repositories. */
export async function getLanguageFacets({ userId }) {
  const rows = await Repository.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    { $unwind: '$chartData.languageDistribution' },
    { $sort: { 'chartData.languageDistribution.bytes': -1 } },
    { $group: { _id: '$chartData.languageDistribution.language', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
  return rows.map((r) => ({ language: r._id, count: r.count }));
}

/** GET /api/repositories/compare?a=…&b=… — factual metric comparison only. */
export async function compareRepositories({ userId, firstId, secondId }) {
  if (!firstId || !secondId) {
    throw ApiError.badRequest('Select two repositories to compare (query parameters a and b are required).');
  }
  if (firstId === secondId) {
    throw ApiError.badRequest('Pick two different repositories to compare.');
  }

  const docs = await Repository.find({ _id: { $in: [firstId, secondId] }, userId });
  if (docs.length !== 2) {
    throw ApiError.notFound('One of the selected repositories is no longer in your library.');
  }

  const [a, b] = docs;
  return { a, b };
}

export default {
  analyzeRepository,
  reanalyzeRepository,
  listRepositories,
  getRepositoryForUser,
  deleteRepositoryForUser,
  getHistoryForUser,
  getUserSummary,
  getLanguageFacets,
  compareRepositories,
};