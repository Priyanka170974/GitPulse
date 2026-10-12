import mongoose from 'mongoose';

/**
 * A repository the user has tracked inside GitPulse.
 * Every document is scoped to `userId` — this is the field used by every
 * query in the app to guarantee user data isolation.
 */
const languageSchema = new mongoose.Schema(
  {
    language: { type: String, required: true },
    bytes: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    color: { type: String, default: '#6366F1' },
  },
  { _id: false },
);

const contributorSchema = new mongoose.Schema(
  {
    login: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    profileUrl: { type: String, default: '' },
    contributions: { type: Number, default: 0 },
  },
  { _id: false },
);

const commitSchema = new mongoose.Schema(
  {
    sha: { type: String, required: true },
    shortSha: { type: String, default: '' },
    message: { type: String, default: '' },
    author: { type: String, default: 'unknown' },
    avatarUrl: { type: String, default: '' },
    url: { type: String, default: '' },
    date: { type: Date, required: true },
  },
  { _id: false },
);

/** Pre-formatted chart series so the frontend never has to reshape data. */
const chartDataSchema = new mongoose.Schema(
  {
    languageDistribution: { type: [languageSchema], default: [] },
    commitActivityDaily: {
      type: [
        new mongoose.Schema({ date: String, label: String, commits: Number }, { _id: false }),
      ],
      default: [],
    },
    commitActivityWeekly: {
      type: [
        new mongoose.Schema({ week: String, label: String, commits: Number }, { _id: false }),
      ],
      default: [],
    },
    contributorActivity: {
      type: [
        new mongoose.Schema(
          { login: String, avatarUrl: String, commits: Number, share: Number },
          { _id: false },
        ),
      ],
      default: [],
    },
    issueStatus: {
      type: [
        new mongoose.Schema({ name: String, value: Number, color: String }, { _id: false }),
      ],
      default: [],
    },
    activityTimeline: {
      type: [
        new mongoose.Schema({ label: String, date: Date, commits: Number, type: String }, {
          _id: false,
        }),
      ],
      default: [],
    },
    starsForksTrend: {
      type: [
        new mongoose.Schema({ label: String, stars: Number, forks: Number }, { _id: false }),
      ],
      default: [],
    },
  },
  { _id: false },
);

/** GitPulse-defined (not official GitHub) activity indicators. */
const indicatorSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    level: { type: String, enum: ['high', 'moderate', 'low', 'unknown'], default: 'unknown' },
    score: { type: Number, default: 0 }, // 0 - 100
    summary: { type: String, default: '' },
    metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const repositorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Identity
    fullName: { type: String, required: true, trim: true }, // owner/repo
    owner: { type: String, required: true, trim: true },
    repoName: { type: String, required: true, trim: true },
    repoUrl: { type: String, required: true },
    homepage: { type: String, default: '' },
    description: { type: String, default: '' },

    // Popularity metrics (real GitHub numbers)
    stars: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    watchers: { type: Number, default: 0 }, // subscribers_count
    openIssues: { type: Number, default: 0 }, // issues only (pull requests excluded)
    closedIssues: { type: Number, default: 0 },
    openPullRequests: { type: Number, default: 0 },
    closedPullRequests: { type: Number, default: 0 },
    defaultBranch: { type: String, default: 'main' },
    topics: { type: [String], default: [] },
    license: { type: String, default: null },
    sizeKb: { type: Number, default: 0 },

    // GitHub timeline
    createdOnGitHub: { type: Date, default: null },
    githubUpdatedAt: { type: Date, default: null },
    lastPushedAt: { type: Date, default: null },

    // Aggregated data
    contributorCount: { type: Number, default: 0 },
    contributors: { type: [contributorSchema], default: [] },
    recentCommits: { type: [commitSchema], default: [] },
    commitStats: {
      total: { type: Number, default: 0 },
      commits7Days: { type: Number, default: 0 },
      commits30Days: { type: Number, default: 0 },
      activeDays30: { type: Number, default: 0 },
      firstCommitAt: { type: Date, default: null },
      lastCommitAt: { type: Date, default: null },
    },

    // Repository origin, taken from GitHub's fork metadata (no extra API call).
    // `verified` is false whenever GitHub provides no official link — GitPulse
    // never guesses an origin.
    originInfo: {
      isFork: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      reason: { type: String, default: null },
      originFullName: { type: String, default: null },
      originOwner: { type: String, default: null },
      originUrl: { type: String, default: null },
      originDescription: { type: String, default: null },
      message: { type: String, default: null },
      source: { type: String, default: null },
    },

    // Clone activity (GitHub repository traffic API — aggregate counts only).
    // GitHub only serves this data to users with push access, so `available`
    // can legitimately be false with a reason explaining why.
    cloneAnalytics: {
      available: { type: Boolean, default: false },
      // Canonical "owner/repo" this block describes. Guarded on read so clone
      // data can never leak between two repositories in the same library.
      repositoryKey: { type: String, default: null },
      reason: { type: String, default: null },
      message: { type: String, default: null },
      // Diagnostics so the UI can explain *why* the data is missing.
      httpStatus: { type: Number, default: null },
      githubMessage: { type: String, default: null },
      totalClones: { type: Number, default: null },
      uniqueCloners: { type: Number, default: null },
      windowDays: { type: Number, default: 14 },
      // Days GitHub actually reported vs days GitPulse had to fill with zeros,
      // so a quiet day is never confused with a day GitHub never sent.
      reportedDays: { type: Number, default: 0 },
      filledDays: { type: Number, default: 14 },
      source: { type: String, default: null },
      fetchedAt: { type: Date, default: null },
      daily: {
        type: [
          new mongoose.Schema(
            { date: String, label: String, count: Number, uniques: Number, filled: Boolean },
            { _id: false },
          ),
        ],
        default: [],
      },
    },

    // Analytics (computed by analyticsService from real GitHub data)
    activity: {
      pulseScore: { type: Number, default: 0 },
      pulseLabel: { type: String, enum: ['high', 'moderate', 'low', 'unknown'], default: 'unknown' },
      indicators: { type: [indicatorSchema], default: [] },
    },
    insights: {
      type: [
        new mongoose.Schema(
          {
            key: String,
            title: String,
            detail: String,
            tone: { type: String, enum: ['positive', 'info', 'neutral', 'warning'], default: 'info' },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
    chartData: { type: chartDataSchema, default: () => ({}) },

    // Bookkeeping
    lastAnalyzedAt: { type: Date, default: Date.now },
    previousAnalysisAt: { type: Date, default: null },
    analysisCount: { type: Number, default: 1 },
    lastError: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
  },
);

// One repository per user. Two different users may track the same repo.
repositorySchema.index({ userId: 1, fullName: 1 }, { unique: true });
repositorySchema.index({ userId: 1, lastAnalyzedAt: -1 });

/* ----------------------------- virtuals ----------------------------- */

repositorySchema.virtual('primaryLanguage').get(function primaryLanguage() {
  return this.chartData?.languageDistribution?.[0]?.language || 'Not detected';
});

repositorySchema.virtual('languageCount').get(function languageCount() {
  return this.chartData?.languageDistribution?.length || 0;
});

repositorySchema.virtual('daysSinceUpdate').get(function daysSinceUpdate() {
  const base = this.lastPushedAt || this.githubUpdatedAt;
  if (!base) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(base).getTime()) / 86400000));
});

repositorySchema.virtual('commitActivityLevel').get(function commitActivityLevel() {
  return this.activity?.indicators?.find((i) => i.key === 'commitActivity')?.level || 'unknown';
});

/* --------------------------- sanitising ---------------------------- */
/* `_id` is kept in the JSON so the frontend can use it directly; the
   `id` virtual is added automatically because `virtuals: true`. */
repositorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform(_doc, ret) {
    ret.id = ret._id;
    return ret;
  },
});

export const Repository = mongoose.model('Repository', repositorySchema);
export default Repository;