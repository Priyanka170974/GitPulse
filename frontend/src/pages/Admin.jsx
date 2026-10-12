import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Database,
  Gauge,
  Github,
  KeyRound,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Star,
  TrendingUp,
  UsersRound,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { LoadingPanel } from '../components/Loading.jsx';
import StatCard from '../components/StatCard.jsx';
import { adminApi } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { formatDateTime, formatNumber, formatRelative } from '../utils/format.js';

const TOTAL_CARDS = [
  { key: 'users', label: 'Total users', icon: UsersRound, gradient: 'from-iris-500 to-iris-400' },
  { key: 'repositories', label: 'Repositories analyzed', icon: Database, gradient: 'from-aqua-400 to-aqua-500' },
  { key: 'analyses', label: 'Total analyses', icon: Activity, gradient: 'from-coral-400 to-coral-500' },
  { key: 'admins', label: 'Administrators', icon: ShieldCheck, gradient: 'from-amber-400 to-coral-400' },
];

export default function Admin() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statistics, usersResponse] = await Promise.all([
        adminApi.statistics(),
        adminApi.users({ search: debouncedSearch, page, limit: 20 }),
      ]);
      setStats(statistics);
      setUsers(usersResponse.users || []);
      setMeta({ total: usersResponse.total, pages: Math.ceil(usersResponse.total / 20) || 1 });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleRole(user) {
    setUpdatingId(user.id);
    try {
      const nextRole = user.role === 'admin' ? 'user' : 'admin';
      await adminApi.updateRole(user.id, nextRole);
      toast.success(`${user.name} is now ${nextRole === 'admin' ? 'an administrator' : 'a standard user'}.`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading && !stats) return <LoadingPanel message="Loading admin statistics…" />;

  if (error) {
    return (
      <ErrorState
        title="Administrator access required"
        message={error.message}
        onRetry={load}
      />
    );
  }

  const github = stats?.github || {};

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Administration"
        title="Admin console"
        description="Platform-wide statistics. These endpoints are protected with JWT + adminMiddleware — a normal account receives 403."
        action={
          <button type="button" onClick={load} className="btn-secondary btn-sm">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        }
      />

      {/* ---------------------------- totals -------------------------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TOTAL_CARDS.map((card, index) => (
          <StatCard
            key={card.key}
            index={index}
            icon={card.icon}
            label={card.label}
            value={formatNumber(stats?.totals?.[card.key] ?? 0)}
            hint="live from MongoDB Atlas"
            gradient={card.gradient}
          />
        ))}
      </section>

      {/* ------------------------ side dashboards --------------------- */}
      <section className="grid gap-5 lg:grid-cols-3">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Gauge className="h-4 w-4 text-iris-500" /> Averages
          </h3>
          <ul className="mt-4 space-y-3">
            {[
              { label: 'Average stars per repo', value: stats?.averages?.avgStars ?? 0 },
              { label: 'Average forks per repo', value: stats?.averages?.avgForks ?? 0 },
              { label: 'Average GitPulse score', value: stats?.averages?.avgPulse ?? 0 },
              { label: 'Stars tracked in total', value: stats?.averages?.totalStars ?? 0 },
            ].map((row) => (
              <li
                key={row.label}
                className="flex items-center justify-between rounded-xl bg-iris-50/50 px-3 py-2"
              >
                <span className="text-xs font-semibold text-ink-soft">{row.label}</span>
                <span className="font-mono text-sm font-bold text-ink">{formatNumber(row.value)}</span>
              </li>
            ))}
          </ul>

          <h4 className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
            Pulse distribution
          </h4>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-iris-50">
            {['high', 'moderate', 'low', 'unknown'].map((level, index) => {
              const entry = stats?.pulseDistribution?.find((d) => d.label === level);
              const total = (stats?.pulseDistribution || []).reduce((sum, d) => sum + d.count, 0) || 1;
              const pct = ((entry?.count || 0) / total) * 100;
              const colors = ['bg-mint-400', 'bg-amber-400', 'bg-coral-400', 'bg-iris-200'];
              return pct > 0 ? (
                <span key={level} className={colors[index]} style={{ width: `${pct}%` }} title={`${level}: ${entry?.count}`} />
              ) : null;
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {['high', 'moderate', 'low'].map((level) => {
              const entry = stats?.pulseDistribution?.find((d) => d.label === level);
              return (
                <span key={level} className="chip bg-iris-50 text-iris-600">
                  {level}: {entry?.count ?? 0}
                </span>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Github className="h-4 w-4 text-ink" /> GitHub API status
          </h3>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-iris-100 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/55">
                Authentication
              </p>
              <p className={`mt-1 text-sm font-bold ${github.authenticated ? 'text-mint-600' : 'text-coral-600'}`}>
                {github.authenticated ? 'GITHUB_TOKEN configured' : 'No token (unauthenticated)'}
              </p>
              <p className="mt-1 text-[11px] text-ink-soft/60">
                {github.authenticated
                  ? '5,000 requests/hour'
                  : '60 requests/hour — add GITHUB_TOKEN in backend/.env to raise the limit'}
              </p>
            </div>

            <div className="rounded-2xl border border-iris-100 bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/55">Rate limit</p>
              {github.remaining !== null ? (
                <>
                  <p className="mt-1 font-display text-2xl font-extrabold text-ink">
                    {github.remaining} / {github.limit}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-iris-50">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-iris-500 to-aqua-400"
                      style={{
                        width: `${github.limit ? Math.min(100, (github.remaining / github.limit) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  {github.reset && (
                    <p className="mt-2 text-[11px] text-ink-soft/60">
                      Resets {formatRelative(github.reset)}
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-1 text-sm text-ink-soft/65">Rate limit information unavailable.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <TrendingUp className="h-4 w-4 text-coral-500" /> Top repositories
          </h3>
          <ul className="mt-4 space-y-2.5">
            {(stats?.topRepositories || []).map((repo) => (
              <li
                key={repo.id}
                className="flex items-center gap-3 rounded-xl border border-iris-50 bg-white/70 px-3 py-2"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-500">
                  <Star className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{repo.fullName}</p>
                  <p className="text-[10px] text-ink-soft/60">
                    {formatNumber(repo.stars)} stars · {formatNumber(repo.contributors)} contributors
                  </p>
                </div>
              </li>
            ))}
            {(stats?.topRepositories || []).length === 0 && (
              <li className="rounded-xl bg-iris-50/40 p-4 text-center text-xs text-ink-soft/60">
                No repositories analyzed yet.
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* -------------------------- recent feed ----------------------- */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Activity className="h-4 w-4 text-aqua-500" /> Recent analyses
          </h3>
          <ul className="mt-4 space-y-2.5">
            {(stats?.recentAnalyses || []).map((analysis) => (
              <li
                key={analysis.id}
                className="flex items-center gap-3 rounded-xl border border-iris-50 bg-white/70 px-3 py-2.5"
              >
                <span
                  className={`chip shrink-0 ${
                    analysis.source === 'reanalyze' ? 'bg-aqua-50 text-aqua-700' : 'bg-iris-50 text-iris-600'
                  }`}
                >
                  {analysis.source}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{analysis.repository}</p>
                  <p className="truncate text-[10px] text-ink-soft/60">
                    by {analysis.user} · {formatDateTime(analysis.analyzedAt)}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[11px] text-ink-soft/70">
                  ★ {formatNumber(analysis.stars)} · {analysis.pulseScore}
                </span>
              </li>
            ))}
            {(stats?.recentAnalyses || []).length === 0 && (
              <li className="rounded-xl bg-iris-50/40 p-4 text-center text-xs text-ink-soft/60">
                No analyses recorded yet.
              </li>
            )}
          </ul>
        </div>

        <div className="card p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <UsersRound className="h-4 w-4 text-mint-500" /> Recent sign-ups
          </h3>
          <ul className="mt-4 space-y-2.5">
            {(stats?.recentUsers || []).map((user) => (
              <li
                key={user.id}
                className="flex items-center gap-3 rounded-xl border border-iris-50 bg-white/70 px-3 py-2.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-mint-100 text-mint-600">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{user.name}</p>
                  <p className="truncate text-[10px] text-ink-soft/60">{user.email}</p>
                </div>
                <span
                  className={`chip shrink-0 ${
                    user.role === 'admin' ? 'bg-coral-50 text-coral-600' : 'bg-iris-50 text-iris-600'
                  }`}
                >
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------- users -------------------------- */}
      <section className="card overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-iris-50 px-5 py-4">
          <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Server className="h-4 w-4 text-iris-500" /> Users ({meta?.total ?? 0})
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search users…"
              className="field py-2 pl-10 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="bg-iris-50/50 text-left">
                {['User', 'Email', 'Role', 'Repositories', 'Joined', 'Action'].map((head) => (
                  <th
                    key={head}
                    className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink-soft/60"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-iris-50/70 transition-colors hover:bg-iris-50/30">
                  <td className="px-5 py-3 font-semibold text-ink">{user.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{user.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`chip ${
                        user.role === 'admin' ? 'bg-coral-50 text-coral-600' : 'bg-iris-50 text-iris-600'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-ink">{user.repositories}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDateTime(user.createdAt)}</td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => toggleRole(user)}
                      disabled={updatingId === user.id}
                      className="btn-secondary btn-sm"
                    >
                      <KeyRound className="h-3 w-3" />
                      {updatingId === user.id ? '…' : user.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(meta?.pages ?? 1) > 1 && (
          <div className="flex items-center justify-between border-t border-iris-50 px-5 py-3 text-xs text-ink-soft/65">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-ghost btn-sm"
            >
              Previous
            </button>
            <span>
              Page {page} of {meta.pages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              disabled={page >= meta.pages}
              className="btn-ghost btn-sm"
            >
              Next
            </button>
          </div>
        )}
      </section>

      <p className="flex items-center justify-center gap-1.5 text-[11px] text-ink-soft/55">
        <BarChart3 className="h-3 w-3" /> Every figure above is aggregated with MongoDB aggregation pipelines
        — nothing on this page is hard-coded.
      </p>
    </div>
  );
}