import mongoose from 'mongoose';

/**
 * One immutable snapshot is written every time a repository is analyzed
 * or re-analyzed, so the History page can show how the numbers moved over time.
 */
const analysisHistorySchema = new mongoose.Schema(
  {
    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ['analyze', 'reanalyze'],
      default: 'analyze',
    },
    snapshot: {
      stars: { type: Number, default: 0 },
      forks: { type: Number, default: 0 },
      watchers: { type: Number, default: 0 },
      openIssues: { type: Number, default: 0 },
      closedIssues: { type: Number, default: 0 },
      openPullRequests: { type: Number, default: 0 },
      contributors: { type: Number, default: 0 },
      primaryLanguage: { type: String, default: 'Not detected' },
      languageCount: { type: Number, default: 0 },
      commitsTotal: { type: Number, default: 0 },
      commits30Days: { type: Number, default: 0 },
      commits7Days: { type: Number, default: 0 },
      pulseScore: { type: Number, default: 0 },
      pulseLabel: { type: String, default: 'unknown' },
      commitActivity: { type: String, default: 'unknown' },
      contributorActivity: { type: String, default: 'unknown' },
      issueActivity: { type: String, default: 'unknown' },
      updateFrequency: { type: String, default: 'unknown' },
    },
    analyzedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

analysisHistorySchema.index({ repositoryId: 1, analyzedAt: 1 });

export const AnalysisHistory = mongoose.model('AnalysisHistory', analysisHistorySchema);
export default AnalysisHistory;