import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Clock3,
  FolderGit2,
  GitFork,
  Layers,
  RefreshCw,
  Sparkles,
  Star,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import RepoInput from '../components/RepoInput.jsx';
import StatCard from '../components/StatCard.jsx';
import RepositoryCard from '../components/RepositoryCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import ActivityBadge from '../components/ActivityBadge.jsx';
import { SkeletonPage } from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import CommitActivityChart from '../charts/CommitActivityChart.jsx';
import { repositoryApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useRepositoryLibrary } from '../hooks/useRepositoryLibrary.js';
import { formatNumber, formatRelative } from '../utils/format.js';

const STAT_CONFIG = [
  { key: 'totalRepositories', label: 'Repositories analyzed', icon: FolderGit2, gradient: 'from-iris-500 to-iris-400' },
  { key: 'totalStars', label: 'Total stars', icon: Star, gradient: 'from-amber-400 to-coral-400' },
  { key: 'totalForks', label: 'Total forks', icon: GitFork, gradient: 'from-aqua-400 to-aqua-500' },
  { key: 'totalContributors', label: 'Contributors tracked', icon: UsersRound, gradient: 'from-mint-400 to-mint-500' },
  { key: 'analysesLast7Days', label: 'Analyses this week', icon: RefreshCw, gradient: 'from-coral-400 to-coral-500' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const { repositories, summary, loading, error, busyId, reload, reanalyze, upsertRepository } =
    useRepositoryLibrary();

  const firstName = user?.name?.split(' ')[0] || 'developer';

  async function handleAnalyze(repoUrl) {
    setAnalyzing(true);
    try {
      const data = await repositoryApi.analyze(repoUrl);
      upsertRepository(data.repository);
      toast.success(data.message || 'Repository analyzed successfully.');
      navigate(`/repositories/${data.repository._id}`);
    } catch (err) {
      toast.error(
        err.message || "We couldn't analyze this repository. Check the URL and try again.",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const pulseData =
    repositories.length > 0
      ? repositories
          .slice(0, 6)
          .map((repo) => ({
            label: repo.repoName.slice(0, 8),
            commits: repo.commitStats?.commits30Days ?? 0,
          }))
      : [];

  return (
    <div className="space-y-7">
      {/* ------------------------- hero header ------------------------- */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-iris-300/30 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-aqua-300/25 blur-3xl animate-drift" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="eyebrow">
              <Sparkles className="h-3 w-3" /> Repository pulse monitor
            </span>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Welcome back, {firstName}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft/70">
              Paste a public GitHub repository below and GitPulse will pull its live data, compute the
              activity indicators and store a snapshot you can compare later.
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 backdrop-blur">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-iris-500 to-aqua-400 text-white">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold leading-none text-ink">
                {summary?.averagePulse ?? 0}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                Average GitPulse score
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------- stats ----------------------------- */}
      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {STAT_CONFIG.map((stat, index) => (
            <StatCard
              key={stat.key}
              index={index}
              icon={stat.icon}
              label={stat.label}
              value={formatNumber(summary?.[stat.key] ?? 0)}
              hint={
                stat.key === 'analysesLast7Days'
                  ? 'from your own account'
                  : 'live from the GitHub API'
              }
              gradient={stat.gradient}
              loading={loading}
            />
          ))}
        </div>
      </section>

      {/* -------------------------- analyze ---------------------------- */}
      <RepoInput onAnalyze={handleAnalyze} loading={analyzing} input={url} onInputChange={setUrl} />

      {/* --------------------------- error ----------------------------- */}
      {error && (
        <ErrorState
          title="We could not load your repository library"
          message={error.message}
          onRetry={reload}
        />
      )}

      {loading ? (
        <SkeletonPage />
      ) : repositories.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No repositories analyzed yet."
          description="Paste a public GitHub repository URL above and GitPulse will pull its live data straight from the GitHub API."
          action={
            <Link to="/about" className="btn-secondary">
              How does GitPulse work?
            </Link>
          }
        />
      ) : (
        <>
          {/* ----------------------- recent repos ---------------------- */}
          <section className="space-y-4">
            <SectionHeading
              eyebrow="Library"
              title="Your repositories"
              description={`${repositories.length} repositor${repositories.length === 1 ? 'y' : 'ies'} tracked — click any card to open its analytics.`}
              action={
                <Link to="/repositories" className="btn-secondary btn-sm">
                  View all <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              }
            />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {(showAll ? repositories : repositories.slice(0, 3)).map((repo, index) => (
                <RepositoryCard
                  key={repo._id}
                  repository={repo}
                  index={index}
                  busy={busyId === repo._id}
                  onReanalyze={reanalyze}
                  onDelete={() => navigate('/repositories')}
                  onCompare={() => navigate(`/compare?a=${repo._id}`)}
                />
              ))}
            </div>

            {repositories.length > 3 && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="btn-ghost btn-sm"
                >
                  {showAll ? 'Show less' : `Show all ${repositories.length} repositories`}
                </button>
              </div>
            )}
          </section>

          {/* ------------------- overview side panels ------------------ */}
          <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <CommitActivityChart
              data={pulseData.map((row) => ({ label: row.label, commits: row.commits }))}
              title="Commits in the last 30 days"
            />

            <div className="card animate-rise flex flex-col p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                  <Clock3 className="h-4 w-4 text-iris-500" /> Recent activity
                </h3>
                <span className="chip bg-iris-50 text-iris-600">latest 5</span>
              </div>

              <ul className="mt-4 flex-1 space-y-2.5">
                {repositories.slice(0, 5).map((repo) => (
                  <li key={repo._id}>
                    <Link
                      to={`/repositories/${repo._id}`}
                      className="group flex items-center gap-3 rounded-2xl border border-iris-50 bg-white/70 p-3 transition-all duration-200 hover:border-iris-200 hover:shadow-soft"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600 transition-colors group-hover:bg-iris-500 group-hover:text-white">
                        <TrendingUp className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{repo.fullName}</p>
                        <p className="text-[11px] text-ink-soft/60">
                          {formatRelative(repo.lastAnalyzedAt)} · {formatNumber(repo.stars)} stars
                        </p>
                      </div>
                      <ActivityBadge
                        level={repo.activity?.pulseLabel || 'unknown'}
                        score={repo.activity?.pulseScore}
                        size="sm"
                        showIcon={false}
                      />
                    </Link>
                  </li>
                ))}
              </ul>

              <Link to="/history" className="btn-secondary btn-sm mt-4 w-full">
                Open analysis history
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}