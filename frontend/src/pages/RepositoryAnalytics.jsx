import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bug,
  CalendarClock,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  GitCompareArrows,
  GitFork,
  History,
  Info,
  RefreshCw,
  Scale,
  Star,
  Trash2,
  UsersRound,
} from 'lucide-react';

import PulseRing from '../components/PulseRing.jsx';
import ActivityBadge from '../components/ActivityBadge.jsx';
import RepositoryInfoCard from '../components/RepositoryInfoCard.jsx';
import CloneActivityCard from '../components/CloneActivityCard.jsx';
import RepositoryOriginCard from '../components/RepositoryOriginCard.jsx';
import InsightCard from '../components/InsightCard.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorState from '../components/ErrorState.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import { LoadingPanel } from '../components/Loading.jsx';

import LanguageDonut from '../charts/LanguageDonut.jsx';
import CommitActivityChart from '../charts/CommitActivityChart.jsx';
import WeeklyCommitChart from '../charts/WeeklyCommitChart.jsx';
import ContributorBarChart from '../charts/ContributorBarChart.jsx';
import IssueStatusChart from '../charts/IssueStatusChart.jsx';
import ActivityTimeline from '../charts/ActivityTimeline.jsx';
import ChartCard from '../charts/ChartCard.jsx';
import ContributionGrid from '../charts/ContributionGrid.jsx';

import { analyticsApi, repositoryApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import {
  formatDate,
  formatDelta,
  formatExact,
  formatFullTimestamp,
  formatLocalDateTime,
  formatNumber,
  formatRelative,
  formatPercent,
  levelTheme,
  truncate,
} from '../utils/format.js';
import { SCORE_DISCLAIMER } from '../utils/constants.js';

/** Avatar with a graceful initials fallback when the image cannot load. */
function CommitAvatar({ commit }) {
  const [failed, setFailed] = useState(false);
  const initials = (commit.author || '?').slice(0, 2).toUpperCase();

  if (!commit.avatarUrl || failed) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-iris-100 text-[10px] font-bold text-iris-600">
        {initials}
      </span>
    );
  }

  return (
    <img
      src={commit.avatarUrl}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-7 w-7 shrink-0 rounded-full bg-iris-50 object-cover"
    />
  );
}

export default function RepositoryAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsApi.forRepository(id);
      setData(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      const response = await repositoryApi.reanalyze(id);
      const fresh = await analyticsApi.forRepository(id);
      setData(fresh);
      const stars = response.deltas?.stars;
      toast.success(
        `${response.repository.fullName} refreshed${
          Number.isFinite(stars) && stars !== 0 ? ` · ${stars > 0 ? '+' : ''}${stars} stars` : ''
        }`,
      );
    } catch (err) {
      toast.error(err.message || 'Could not refresh this repository from GitHub.');
    } finally {
      setReanalyzing(false);
    }
  }

  async function handleDelete() {
    try {
      await repositoryApi.remove(id);
      toast.success('Repository removed from your library.');
      navigate('/repositories');
    } catch (err) {
      toast.error(err.message || 'Could not delete this repository.');
    } finally {
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return <LoadingPanel message="Loading repository analytics…" submessage="Reading the stored analysis from MongoDB Atlas" />;
  }

  if (error) {
    return (
      <ErrorState
        title="We could not load this repository"
        message={error.message}
        onRetry={load}
        className="mt-4"
      />
    );
  }

  const { repository, metrics, activity, insights, charts, commits, contributors, delta, cloneAnalytics, originInfo } = data;
  const theme = levelTheme(activity.pulseLabel);

  const metricCards = [
    { label: 'Stars', value: metrics.stars, icon: Star, tone: 'text-amber-500', delta: delta?.stars },
    { label: 'Forks', value: metrics.forks, icon: GitFork, tone: 'text-aqua-600', delta: delta?.forks },
    { label: 'Open issues', value: metrics.openIssues, icon: Bug, tone: 'text-coral-500', delta: delta?.openIssues },
    { label: 'Contributors', value: metrics.contributors, icon: UsersRound, tone: 'text-mint-600', delta: delta?.contributors },
  ];

  return (
    <div className="space-y-7">
      {/* ----------------------------- header ---------------------------- */}
      <section className="card relative overflow-hidden p-6 sm:p-7">
        <div
          className={`pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-gradient-to-br ${theme.soft} blur-3xl`}
        />

        <div className="relative">
          <Link
            to="/repositories"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft/65 transition hover:text-iris-600"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to my repositories
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                  {repository.fullName}
                </h2>
                <ActivityBadge level={activity.pulseLabel} score={activity.pulseScore} size="lg" />
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-soft/75">
                {repository.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <a
                  href={repository.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chip border border-iris-100 bg-white text-ink-soft transition hover:border-iris-300 hover:text-iris-600"
                >
                  <ExternalLink className="h-3 w-3" /> Open on GitHub
                </a>
                <span className="chip border border-iris-100 bg-white text-ink-soft">
                  <GitBranch className="h-3 w-3" /> {repository.defaultBranch}
                </span>
                {repository.license && (
                  <span className="chip border border-iris-100 bg-white text-ink-soft">{repository.license}</span>
                )}
                <span
                  className="chip border border-iris-100 bg-white text-ink-soft"
                  title={formatFullTimestamp(repository.createdOnGitHub)}
                >
                  <CalendarClock className="h-3 w-3" />
                  Created {formatLocalDateTime(repository.createdOnGitHub) || 'date unavailable'}
                </span>
                <span className="chip border border-iris-100 bg-white text-ink-soft">
                  Last analyzed {formatRelative(repository.lastAnalyzedAt)} ·{' '}
                  {repository.analysisCount} analysis
                  {repository.analysisCount === 1 ? '' : 'es'}
                </span>
              </div>

              {repository.topics?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {repository.topics.map((topic) => (
                    <span key={topic} className="chip bg-iris-50 text-iris-600">
                      #{topic}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2">
              <button type="button" onClick={handleReanalyze} disabled={reanalyzing} className="btn-primary">
                <RefreshCw className={`h-4 w-4 ${reanalyzing ? 'animate-spin' : ''}`} />
                {reanalyzing ? 'Refreshing repository data…' : 'Re-analyze'}
              </button>
              <Link to={`/history?repo=${id}`} className="btn-secondary">
                <History className="h-4 w-4" /> View history
              </Link>
              <Link to={`/compare?a=${id}`} className="btn-secondary">
                <GitCompareArrows className="h-4 w-4" /> Compare
              </Link>
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn-ghost text-coral-600">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      {reanalyzing && (
        <div className="card flex items-center gap-3 border-iris-200 bg-iris-50/70 px-5 py-3 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-iris-600" />
          </span>
          <p className="text-sm font-medium text-iris-700">
            Refreshing repository data from the GitHub API…
          </p>
        </div>
      )}

      {/* ------------------- repository information -------------------- */}
      <RepositoryInfoCard repository={repository} />

      {/* -------------------------- metrics ---------------------------- */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="card card-hover animate-rise p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-soft/65">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.tone}`} />
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold leading-none text-ink">
                {formatNumber(card.value)}
                <span className="ml-2 align-middle font-mono text-[11px] font-medium text-ink-soft/45">
                  {formatExact(card.value)}
                </span>
              </p>
              {card.delta !== undefined && card.delta !== null ? (
                <p
                  className={`mt-3 text-xs font-semibold ${
                    card.delta > 0
                      ? 'text-mint-600'
                      : card.delta < 0
                        ? 'text-coral-600'
                        : 'text-ink-soft/55'
                  }`}
                >
                  {formatDelta(card.delta)} since{' '}
                  {delta?.previousAnalyzedAt ? formatDate(delta.previousAnalyzedAt) : 'the previous analysis'}
                </p>
              ) : (
                <p className="mt-3 text-xs text-ink-soft/55">First GitPulse analysis</p>
              )}
            </div>
          );
        })}
      </section>

      {/* --------------------------- pulse ----------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="card animate-rise flex flex-col items-center justify-center p-6 text-center">
          <PulseRing score={activity.pulseScore} level={activity.pulseLabel} size={168} />
          <h3 className="mt-5 font-display text-lg font-bold text-ink">GitPulse score</h3>
          <p className="mt-2 max-w-[260px] text-xs leading-relaxed text-ink-soft/70">
            {metrics.commits30Days} commits in 30 days · {metrics.contributors} contributors ·{' '}
            {formatPercent(metrics.primaryLanguageShare, 0)} {metrics.primaryLanguage}
          </p>
          <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-iris-50 px-3 py-2 text-left text-[10px] leading-relaxed text-ink-soft/70">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-iris-500" />
            {SCORE_DISCLAIMER}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {activity.indicators.map((indicator, index) => {
            const indicatorTheme = levelTheme(indicator.level);
            const definition = activity.definitions?.[indicator.key];
            return (
              <div
                key={indicator.key}
                className="card animate-rise p-5"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="font-display text-sm font-bold text-ink">{indicator.label}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">{indicator.summary}</p>
                  </div>
                  <ActivityBadge level={indicator.level} size="sm" showIcon={false} />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-iris-50">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(3, indicator.score)}%`,
                        background: `linear-gradient(90deg, ${indicatorTheme.stroke}, ${indicatorTheme.stroke}66)`,
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-ink">{indicator.score}</span>
                </div>

                {definition && (
                  <p className="mt-2 text-[10px] leading-relaxed text-ink-soft/50">{definition.unitNote}</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------- charts --------------------------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <LanguageDonut languages={charts.languageDistribution} />
        <CommitActivityChart data={charts.commitActivityDaily} />
        <ContributorBarChart data={charts.contributorActivity} />
        <IssueStatusChart
          open={metrics.openIssues}
          closed={metrics.closedIssues}
          labels={charts.issueStatus?.labels}
        />
        <WeeklyCommitChart data={charts.commitActivityWeekly} />
        <ChartCard
          icon={Scale}
          title="Commit contribution grid"
          description="One square per day — darker means more commits."
          info="Inspired by GitHub's contribution graph, built from the same daily commit series GitPulse stores for this repository."
        >
          <ContributionGrid data={charts.commitActivityDaily} />
          <p className="mt-4 text-xs text-ink-soft/60">
            {metrics.commits7Days} commits in the last 7 days · {metrics.activeDays30} active days in the last
            30 days.
          </p>
        </ChartCard>
      </section>

      {/* --------------------- repository origin + clone activity ----- */}
      <RepositoryOriginCard originInfo={originInfo} loading={loading} />

      <CloneActivityCard cloneAnalytics={cloneAnalytics} loading={loading} />

      {/* --------------------------- timeline -------------------------- */}
      <section className="grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <ChartCard
          icon={Activity}
          title="Repository activity timeline"
          description="Real events returned by GitHub: creation, recent commits and the last push."
        >
          <div className="max-h-[420px] overflow-y-auto pr-1">
            <ActivityTimeline events={charts.activityTimeline} />
          </div>
        </ChartCard>

        <ChartCard
          icon={GitCommitHorizontal}
          title="Latest commits"
          description="The most recent commits returned by the GitHub API."
        >
          <ul className="max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
            {commits.length === 0 && (
              <li className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
                GitHub did not return any commits for this repository.
              </li>
            )}
            {commits.map((commit, index) => (
              <li
                key={`${commit.sha}-${index}`}
                className="group rounded-2xl border border-iris-50 bg-white/70 p-3 transition-all duration-200 hover:border-iris-200 hover:shadow-soft"
              >
                <div className="flex items-start gap-2.5">
                  <CommitAvatar commit={commit} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-snug text-ink">
                      {truncate(commit.message, 90)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-soft/60">
                      <span className="font-semibold text-iris-600">{commit.author}</span> ·{' '}
                      {formatRelative(commit.date)} ·{' '}
                      <span className="font-mono">{commit.shortSha}</span>
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>

      {/* -------------------------- contributors ----------------------- */}
      {contributors.length > 0 && (
        <section>
          <SectionHeading
            eyebrow="People"
            title="Top contributors"
            description="All-time contribution counts from the GitHub contributors endpoint."
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {contributors.slice(0, 10).map((contributor, index) => (
              <div
                key={`${contributor.login}-${index}`}
                className="card card-hover animate-rise flex items-center gap-3 p-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {contributor.avatarUrl ? (
                  <img
                    src={contributor.avatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className="h-10 w-10 shrink-0 rounded-xl bg-iris-50 object-cover"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{contributor.login}</p>
                  <p className="text-[11px] text-ink-soft/60">{formatExact(contributor.contributions)} commits</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------------------------- insights ------------------------- */}
      <section>
        <SectionHeading
          eyebrow="Repository Insights"
          title="What the data says"
          description="Observations generated by the GitPulse analytics service from the numbers above — not official GitHub scores."
        />

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insights.map((insight, index) => (
            <InsightCard key={insight.key} insight={insight} index={index} />
          ))}
        </div>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this repository?"
        message={`${repository.fullName} and all of its analysis history will be permanently removed from your library. The repository on GitHub is not affected.`}
        confirmLabel="Delete repository"
        loading={reanalyzing}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}