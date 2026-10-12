import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, GitCompareArrows, Info, Scale, Search } from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import ActivityBadge from '../components/ActivityBadge.jsx';
import { SkeletonChart, Spinner } from '../components/Loading.jsx';
import CompareChart from '../charts/CompareChart.jsx';
import CompareLanguageChart from '../charts/CompareLanguageChart.jsx';
import { repositoryApi } from '../services/api.js';
import { useRepositoryLibrary } from '../hooks/useRepositoryLibrary.js';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatExact, formatNumber, formatRelative, levelTheme } from '../utils/format.js';

function RepoSelect({ label, value, onChange, repositories, accent, disabled }) {
  const term = useMemo(() => label.toLowerCase().includes('first') ? 'first' : 'second', [label]);

  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-soft/70">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
        {label}
      </span>

      <div className="relative">
        <select
          value={value || ''}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="field appearance-none pr-10 font-semibold"
        >
          <option value="">Select a repository…</option>
          {repositories.map((repo) => (
            <option key={repo._id} value={repo._id}>
              {repo.fullName} · {formatNumber(repo.stars)} stars
            </option>
          ))}
        </select>
        <ArrowLeftRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-ink-soft/40" />
      </div>

      {repositories.length < 2 && term && (
        <span className="text-[11px] text-ink-soft/55">
          Analyze at least {2 - repositories.length} more repository to compare.
        </span>
      )}
    </label>
  );
}

export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { repositories, loading: listLoading } = useRepositoryLibrary();
  const toast = useToast();

  const [firstId, setFirstId] = useState(searchParams.get('a') || '');
  const [secondId, setSecondId] = useState(searchParams.get('b') || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const a = result?.repositories?.a;
  const b = result?.repositories?.b;

  async function runComparison(idA = firstId, idB = secondId) {
    if (!idA || !idB || idA === idB) return;
    setLoading(true);
    setError(null);
    try {
      const data = await repositoryApi.compare(idA, idB);
      setResult(data);
      setSearchParams({ a: idA, b: idB }, { replace: true });
    } catch (err) {
      setError(err);
      setResult(null);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const idA = searchParams.get('a');
    const idB = searchParams.get('b');
    if (idA && idB && idA !== idB && repositories.length >= 2) runComparison(idA, idB);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repositories.length]);

  const ready = firstId && secondId && firstId !== secondId;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Compare"
        title="Repository Compare"
        description="Pick two saved repositories and compare their factual GitHub metrics side by side."
      />

      {/* ------------------------ selector card ----------------------- */}
      <div className="card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <RepoSelect
            label="First repository"
            value={firstId}
            onChange={setFirstId}
            repositories={repositories}
            accent="#6C5CE7"
            disabled={listLoading}
          />
          <RepoSelect
            label="Second repository"
            value={secondId}
            onChange={setSecondId}
            repositories={repositories}
            accent="#12A9CC"
            disabled={listLoading}
          />
          <button
            type="button"
            onClick={() => runComparison()}
            disabled={!ready || loading}
            className="btn-primary sm:mb-0.5"
          >
            {loading ? <Spinner className="h-4 w-4" /> : <GitCompareArrows className="h-4 w-4" />}
            {loading ? 'Comparing…' : 'Compare'}
          </button>
        </div>

        {ready && firstId === secondId && (
          <p className="mt-3 text-xs font-semibold text-coral-600">Pick two different repositories.</p>
        )}
      </div>

      {error && <ErrorState title="Comparison failed" message={error.message} onRetry={() => runComparison()} />}

      {/* --------------------------- results -------------------------- */}
      {loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      )}

      {!loading && !a && repositories.length >= 2 && (
        <EmptyState
          icon={GitCompareArrows}
          title="Select two repositories to compare."
          description="Choose any two repositories from your library. GitPulse reports stars, forks, issues, contributors, languages and activity — it never declares one project better than another."
        />
      )}

      {!loading && repositories.length < 2 && (
        <EmptyState
          icon={Search}
          title="You need at least two repositories."
          description="Analyze two public GitHub repositories first, then come back here to compare them."
        />
      )}

      {!loading && a && b && (
        <div className="space-y-5">
          {/* side-by-side headers */}
          <div className="grid gap-4 md:grid-cols-2">
            {[a, b].map((repo, index) => (
              <article
                key={repo.id}
                className="card animate-rise relative overflow-hidden p-5"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: index === 0 ? 'linear-gradient(90deg,#6C5CE7,#8B7DF3)' : 'linear-gradient(90deg,#12A9CC,#5FDDF4)' }}
                />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-ink">{repo.fullName}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-soft/70">{repo.description}</p>
                  </div>
                  <ActivityBadge level={repo.pulseLabel} score={repo.pulseScore} />
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                  {[
                    { k: 'Stars', v: formatNumber(repo.stars) },
                    { k: 'Forks', v: formatNumber(repo.forks) },
                    { k: 'Contributors', v: formatNumber(repo.contributors) },
                  ].map((item) => (
                    <div key={item.k} className="rounded-xl bg-iris-50/60 py-2">
                      <dt className="text-[10px] uppercase tracking-wider text-ink-soft/60">{item.k}</dt>
                      <dd className="mt-0.5 font-display text-base font-extrabold text-ink">{item.v}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-3 text-[11px] text-ink-soft/55">
                  Primary language <strong className="text-iris-600">{repo.primaryLanguage}</strong> ·{' '}
                  {repo.languageCount} languages · analyzed {formatRelative(repo.lastAnalyzedAt)}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <CompareChart comparison={result.comparison} nameA={a.fullName} nameB={b.fullName} />
            <CompareLanguageChart
              languagesA={a.languages}
              languagesB={b.languages}
              nameA={a.fullName}
              nameB={b.fullName}
            />
          </div>

          {/* fact table */}
          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-iris-50 px-5 py-4">
              <Scale className="h-4 w-4 text-iris-500" />
              <h3 className="font-display text-base font-bold text-ink">Metric by metric</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="bg-iris-50/50 text-left">
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
                      Metric
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-iris-600">
                      {a.fullName}
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-aqua-700">
                      {b.fullName}
                    </th>
                    <th className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-ink-soft/60">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.comparison.map((row) => {
                    const diff = row.a - row.b;
                    return (
                      <tr key={row.key} className="border-t border-iris-50/70 transition-colors hover:bg-iris-50/30">
                        <td className="px-5 py-3 font-semibold text-ink">{row.label}</td>
                        <td className="px-5 py-3 font-mono text-ink">{formatExact(row.a)}</td>
                        <td className="px-5 py-3 font-mono text-ink">{formatExact(row.b)}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`chip ${
                              diff > 0
                                ? 'bg-iris-50 text-iris-600'
                                : diff < 0
                                  ? 'bg-aqua-50 text-aqua-700'
                                  : 'bg-iris-50/60 text-ink-soft/60'
                            }`}
                          >
                            {diff === 0 ? 'equal' : `${diff > 0 ? '+' : ''}${formatExact(diff)}`}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* indicators */}
          <div className="grid gap-4 md:grid-cols-2">
            {[a, b].map((repo, index) => (
              <div key={repo.id} className="card p-5">
                <h3 className="font-display text-base font-bold text-ink">
                  {repo.fullName}{' '}
                  <span className="text-xs font-medium text-ink-soft/55">· indicators</span>
                </h3>
                <ul className="mt-3 space-y-2.5">
                  {repo.indicators.map((indicator) => {
                    const theme = levelTheme(indicator.level);
                    return (
                      <li key={indicator.key} className="flex items-center gap-3">
                        <span className="w-36 shrink-0 text-xs font-semibold text-ink-soft">{indicator.label}</span>
                        <span className="h-2 flex-1 overflow-hidden rounded-full bg-iris-50">
                          <span
                            className="block h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(3, indicator.score)}%`, backgroundColor: theme.stroke }}
                          />
                        </span>
                        <span className={`chip w-[86px] justify-center ${theme.bg} ${theme.text}`}>
                          {theme.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-[11px] text-ink-soft/55">
                  Created on GitHub {formatDate(repo.createdOnGitHub)}
                </p>
                {index === 1 && (
                  <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-iris-50 px-3 py-2 text-[10px] leading-relaxed text-ink-soft/70">
                    <Info className="mt-0.5 h-3 w-3 shrink-0 text-iris-500" />
                    {result.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}