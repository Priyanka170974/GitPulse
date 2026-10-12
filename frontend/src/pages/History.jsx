import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  FolderGit2,
  History as HistoryIcon,
  Minus,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ActivityBadge from '../components/ActivityBadge.jsx';
import { LoadingPanel } from '../components/Loading.jsx';
import HistoryTrendChart from '../charts/HistoryTrendChart.jsx';
import { repositoryApi } from '../services/api.js';
import { useRepositoryLibrary } from '../hooks/useRepositoryLibrary.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDateTime, formatExact, formatNumber, formatRelative } from '../utils/format.js';

const GROWTH_STATS = [
  { key: 'stars', label: 'Stars', icon: TrendingUp, tone: 'text-amber-500' },
  { key: 'forks', label: 'Forks', icon: ArrowUpRight, tone: 'text-aqua-600' },
  { key: 'openIssues', label: 'Open issues', icon: ArrowDownRight, tone: 'text-coral-500' },
  { key: 'contributors', label: 'Contributors', icon: Activity, tone: 'text-mint-600' },
  { key: 'pulseScore', label: 'GitPulse score', icon: HistoryIcon, tone: 'text-iris-600' },
];

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { repositories, loading: listLoading } = useRepositoryLibrary();
  const toast = useToast();

  const [repoId, setRepoId] = useState(searchParams.get('repo') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Default to the first saved repository once the library loads.
  useEffect(() => {
    if (!repoId && repositories.length > 0) {
      setRepoId(repositories[0]._id);
      setSearchParams({ repo: repositories[0]._id }, { replace: true });
    }
  }, [repoId, repositories, setSearchParams]);

  const load = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await repositoryApi.history(id);
      setData(response);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (repoId) load(repoId);
  }, [repoId, load]);

  async function handleReanalyze() {
    setReanalyzing(true);
    try {
      await repositoryApi.reanalyze(repoId);
      await load(repoId);
      toast.success('New snapshot saved. The history below is now up to date.');
    } catch (err) {
      toast.error(err.message || 'Could not re-analyze this repository.');
    } finally {
      setReanalyzing(false);
    }
  }

  const snapshots = data?.history || [];
  const growth = data?.growth;
  const selected = repositories.find((repo) => repo._id === repoId);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="History"
        title="Analysis history"
        description="Every analyze and re-analyze writes an immutable snapshot, so you can see exactly how the repository moved between two moments in time."
        action={
          <button
            type="button"
            onClick={handleReanalyze}
            disabled={!repoId || reanalyzing}
            className="btn-primary btn-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
            {reanalyzing ? 'Re-analyzing…' : 'Re-analyze now'}
          </button>
        }
      />

      {/* ------------------------ selector card ----------------------- */}
      <div className="card p-5">
        <label className="block">
          <span className="field-label">Repository</span>
          <select
            value={repoId}
            onChange={(event) => {
              setRepoId(event.target.value);
              setSearchParams({ repo: event.target.value }, { replace: true });
            }}
            disabled={listLoading || repositories.length === 0}
            className="field font-semibold"
          >
            {repositories.length === 0 && <option value="">No repositories yet</option>}
            {repositories.map((repo) => (
              <option key={repo._id} value={repo._id}>
                {repo.fullName} · {formatNumber(repo.stars)} stars
              </option>
            ))}
          </select>
        </label>
      </div>

      {repositories.length === 0 && !listLoading && (
        <EmptyState
          icon={FolderGit2}
          title="No repositories analyzed yet."
          description="History is created automatically the first time you analyze a repository."
          action={
            <Link to="/dashboard" className="btn-primary">
              Analyze a repository
            </Link>
          }
        />
      )}

      {loading && <LoadingPanel message="Loading analysis snapshots…" />}

      {error && <ErrorState message={error.message} onRetry={() => load(repoId)} />}

      {!loading && data && (
        <>
          {/* growth summary */}
          <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {GROWTH_STATS.map((stat, index) => {
              const value = growth ? growth[stat.key] : 0;
              const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
              return (
                <div
                  key={stat.key}
                  className="card card-hover animate-rise p-4"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
                      {stat.label}
                    </span>
                    <Icon className={`h-3.5 w-3.5 ${value === 0 ? 'text-ink-soft/40' : stat.tone}`} />
                  </div>
                  <p
                    className={`mt-2 font-display text-2xl font-extrabold leading-none ${
                      value > 0 ? 'text-mint-600' : value < 0 ? 'text-coral-600' : 'text-ink'
                    }`}
                  >
                    {value > 0 ? '+' : ''}
                    {formatExact(value || 0)}
                  </p>
                  <p className="mt-2 text-[10px] text-ink-soft/55">
                    {growth ? `across ${growth.snapshots} snapshots` : 'needs a second snapshot'}
                  </p>
                </div>
              );
            })}
          </section>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <HistoryTrendChart trend={data.trend} />

            {/* snapshot timeline */}
            <div className="card flex flex-col p-5">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <HistoryIcon className="h-4 w-4 text-iris-500" /> Snapshot timeline
              </h3>
              <p className="mt-1 text-xs text-ink-soft/65">
                Newest first · {snapshots.length} snapshot{snapshots.length === 1 ? '' : 's'}
              </p>

              <ol className="mt-4 max-h-[420px] space-y-2.5 overflow-y-auto pr-1">
                {[...snapshots].reverse().map((snapshot, index) => (
                  <li
                    key={snapshot.id}
                    className="animate-rise rounded-2xl border border-iris-50 bg-white/75 p-3.5 transition-all duration-300 hover:border-iris-200 hover:shadow-soft"
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink">
                        <Clock3 className="h-3.5 w-3.5 text-iris-500" />
                        {formatDateTime(snapshot.analyzedAt)}
                      </span>
                      <span
                        className={`chip ${
                          snapshot.source === 'reanalyze'
                            ? 'bg-aqua-50 text-aqua-700'
                            : 'bg-iris-50 text-iris-600'
                        }`}
                      >
                        {snapshot.source}
                      </span>
                    </div>

                    <div className="mt-2.5 grid grid-cols-4 gap-2 text-center">
                      {[
                        { k: 'Stars', v: formatNumber(snapshot.snapshot.stars) },
                        { k: 'Forks', v: formatNumber(snapshot.snapshot.forks) },
                        { k: 'Issues', v: formatNumber(snapshot.snapshot.openIssues) },
                        { k: 'Contrib.', v: formatNumber(snapshot.snapshot.contributors) },
                      ].map((item) => (
                        <div key={item.k} className="rounded-xl bg-iris-50/50 py-1.5">
                          <p className="font-mono text-xs font-bold text-ink">{item.v}</p>
                          <p className="text-[9px] uppercase tracking-wide text-ink-soft/55">{item.k}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <ActivityBadge level={snapshot.snapshot.commitActivity} size="sm" showIcon={false} />
                      <ActivityBadge level={snapshot.snapshot.updateFrequency} size="sm" showIcon={false} />
                      <span className="chip bg-iris-50 text-iris-600">
                        pulse {snapshot.snapshot.pulseScore}
                      </span>
                      <span className="chip bg-white text-ink-soft">{snapshot.snapshot.primaryLanguage}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {selected && (
            <p className="text-center text-xs text-ink-soft/60">
              Showing history for{' '}
              <Link to={`/repositories/${selected._id}`} className="font-semibold text-iris-600 link-underline">
                {selected.fullName}
              </Link>{' '}
              — last analyzed {formatRelative(selected.lastAnalyzedAt)}.
            </p>
          )}
        </>
      )}
    </div>
  );
}