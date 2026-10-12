import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FolderGit2, GitCompareArrows, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react';

import RepositoryCard from '../components/RepositoryCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { SkeletonCard, Spinner } from '../components/Loading.jsx';
import { useRepositoryLibrary } from '../hooks/useRepositoryLibrary.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { ACTIVITY_FILTERS, SORT_OPTIONS } from '../utils/constants.js';
import { formatNumber } from '../utils/format.js';

export default function Repositories() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');
  const [activity, setActivity] = useState(searchParams.get('activity') || 'all');
  const [language, setLanguage] = useState(searchParams.get('language') || 'all');
  const [deleting, setDeleting] = useState(null);
  const [view, setView] = useState('grid');

  const debouncedSearch = useDebounce(search, 300);
  const { repositories, languages, loading, error, busyId, reload, reanalyze, remove } =
    useRepositoryLibrary();

  /* Filtering + sorting happens locally so typing stays instant. */
  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    let rows = repositories.filter((repo) => {
      if (!term) return true;
      return (
        repo.fullName.toLowerCase().includes(term) ||
        (repo.description || '').toLowerCase().includes(term) ||
        (repo.owner || '').toLowerCase().includes(term)
      );
    });

    if (activity !== 'all') {
      rows = rows.filter(
        (repo) =>
          repo.activity?.indicators?.find((i) => i.key === 'commitActivity')?.level === activity,
      );
    }

    if (language !== 'all') {
      rows = rows.filter(
        (repo) => repo.chartData?.languageDistribution?.[0]?.language?.toLowerCase() === language.toLowerCase(),
      );
    }

    const sorters = {
      recent: (a, b) => new Date(b.lastAnalyzedAt) - new Date(a.lastAnalyzedAt),
      stars: (a, b) => b.stars - a.stars,
      forks: (a, b) => b.forks - a.forks,
      contributors: (a, b) => (b.contributorCount || 0) - (a.contributorCount || 0),
      issues: (a, b) => (b.openIssues || 0) - (a.openIssues || 0),
      pulse: (a, b) => (b.activity?.pulseScore || 0) - (a.activity?.pulseScore || 0),
      name: (a, b) => a.fullName.localeCompare(b.fullName),
    };

    return [...rows].sort(sorters[sort] || sorters.recent);
  }, [repositories, debouncedSearch, activity, language, sort]);

  const hasFilters = Boolean(search) || activity !== 'all' || language !== 'all';

  function resetFilters() {
    setSearch('');
    setActivity('all');
    setLanguage('all');
    setSort('recent');
    setSearchParams({});
  }

  function syncParams(next) {
    const merged = { search: debouncedSearch, sort, activity, language, ...next };
    const cleaned = Object.fromEntries(Object.entries(merged).filter(([, v]) => v && v !== 'all' && v !== 'recent'));
    setSearchParams(cleaned, { replace: true });
  }

  async function confirmDelete() {
    if (!deleting) return;
    const ok = await remove(deleting);
    if (ok) setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Library"
        title="My repositories"
        description="Everything you have analyzed with GitPulse. Search, filter and sort — then open any card for the full analytics view."
        action={
          <Link2Compare navigate={navigate} repositories={repositories} />
        }
      />

      {/* ------------------------- toolbar --------------------------- */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                syncParams({ search: e.target.value });
              }}
              placeholder="Search by name, owner or description…"
              className="field pl-11"
              aria-label="Search repositories"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-soft/60 sm:inline-flex">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </span>

            <select
              value={activity}
              onChange={(e) => {
                setActivity(e.target.value);
                syncParams({ activity: e.target.value });
              }}
              className="field w-auto py-2.5 text-xs"
              aria-label="Filter by activity level"
            >
              {ACTIVITY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                syncParams({ language: e.target.value });
              }}
              className="field w-auto py-2.5 text-xs"
              aria-label="Filter by primary language"
            >
              <option value="all">All languages</option>
              {languages.map((item) => (
                <option key={item.language} value={item.language}>
                  {item.language} ({item.count})
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                syncParams({ sort: e.target.value });
              }}
              className="field w-auto py-2.5 text-xs"
              aria-label="Sort repositories"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex overflow-hidden rounded-xl border border-iris-100 bg-white">
              <button
                type="button"
                onClick={() => setView('grid')}
                className={`grid h-10 w-10 place-items-center transition ${
                  view === 'grid' ? 'bg-iris-500 text-white' : 'text-ink-soft hover:bg-iris-50'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView('list')}
                className={`grid h-10 w-10 place-items-center transition ${
                  view === 'list' ? 'bg-iris-500 text-white' : 'text-ink-soft hover:bg-iris-50'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-soft/65">
          <span>
            Showing <strong className="text-ink">{filtered.length}</strong> of{' '}
            <strong className="text-ink">{repositories.length}</strong> repositories
          </span>
          {hasFilters && (
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 font-semibold text-coral-600">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* -------------------------- results -------------------------- */}
      {error && <ErrorState message={error.message} onRetry={reload} />}

      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No repositories analyzed yet."
          description="Analyze your first public GitHub repository from the dashboard and it will appear here."
          action={
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-primary">
              Analyze a repository
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No repositories match those filters."
          description="Try a different search term, or reset the filters to see your full library."
          action={
            <button type="button" onClick={resetFilters} className="btn-secondary">
              Reset filters
            </button>
          }
        />
      ) : (
        <div className={view === 'grid' ? 'grid gap-5 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-4'}>
          {filtered.map((repo, index) => (
            <RepositoryCard
              key={repo._id}
              repository={repo}
              index={index}
              busy={busyId === repo._id}
              onReanalyze={reanalyze}
              onDelete={setDeleting}
              onCompare={() => navigate(`/compare?a=${repo._id}`)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this repository?"
        message={
          deleting
            ? `${deleting.fullName} and all of its analysis history will be permanently removed from your library. This does not affect the repository on GitHub.`
            : ''
        }
        confirmLabel="Delete repository"
        loading={busyId === deleting?._id}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function Link2Compare({ navigate, repositories }) {
  return (
    <button
      type="button"
      onClick={() => navigate('/compare')}
      disabled={repositories.length < 2}
      className="btn-secondary btn-sm disabled:cursor-not-allowed disabled:opacity-50"
      title={repositories.length < 2 ? 'Analyze at least two repositories to compare' : 'Compare two repositories'}
    >
      {repositories.length < 2 ? <Spinner className="h-3.5 w-3.5" /> : <GitCompareArrows className="h-3.5 w-3.5" />}
      Compare repositories
    </button>
  );
}