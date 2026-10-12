import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Clock3,
  ExternalLink,
  GitCompareArrows,
  GitFork,
  Github,
  MoreVertical,
  RefreshCw,
  Star,
  Trash2,
  UsersRound,
} from 'lucide-react';
import ActivityBadge from './ActivityBadge.jsx';
import { formatNumber, formatRelative, truncate } from '../utils/format.js';

/**
 * Card used in the repository library and on the dashboard.
 */
export default function RepositoryCard({ repository, onReanalyze, onDelete, onCompare, index = 0, busy }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const activityLevel =
    repository.activity?.indicators?.find((i) => i.key === 'commitActivity')?.level || 'unknown';
  const activityScore = repository.activity?.indicators?.find((i) => i.key === 'commitActivity')?.score;
  const primary = repository.chartData?.languageDistribution?.[0];
  const secondary = repository.chartData?.languageDistribution?.[1];

  /* Close the action menu when clicking anywhere else. */
  useEffect(() => {
    if (!menuOpen) return undefined;
    function onDocumentClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    function onKey(event) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const actions = [
    { icon: Activity, label: 'View analytics', to: `/repositories/${repository._id}` },
    { icon: RefreshCw, label: 'Re-analyze', onClick: () => onReanalyze?.(repository), disabled: busy },
    { icon: GitCompareArrows, label: 'Add to compare', onClick: () => onCompare?.(repository) },
    { icon: ExternalLink, label: 'Open on GitHub', href: repository.repoUrl },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete?.(repository), danger: true },
  ];

  return (
    <article
      className="card card-hover animate-rise group relative flex flex-col overflow-visible"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="flex items-start justify-between gap-3 rounded-t-3xl p-5 pb-3">
        <div className="min-w-0">
          <Link
            to={`/repositories/${repository._id}`}
            className="group/link inline-flex items-center gap-2 text-lg font-bold text-ink transition hover:text-iris-600"
          >
            <Github className="h-4 w-4 shrink-0 text-ink-soft/50" />
            <span className="truncate">{repository.fullName}</span>
          </Link>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft/70">
            {truncate(repository.description || 'No description provided.', 120)}
          </p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Repository actions"
            aria-expanded={menuOpen}
            className="rounded-xl p-1.5 text-ink-soft/50 transition hover:bg-iris-50 hover:text-iris-600"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-2 w-52 animate-fade-in rounded-2xl border border-iris-100 bg-white/95 p-2 shadow-lift backdrop-blur-xl">
              {actions.map((action) => {
                const Icon = action.icon;
                const className = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold transition ${
                  action.danger
                    ? 'text-coral-600 hover:bg-coral-50'
                    : 'text-ink-soft hover:bg-iris-50 hover:text-iris-700'
                } ${action.disabled ? 'pointer-events-none opacity-50' : ''}`;

                if (action.to) {
                  return (
                    <Link key={action.label} to={action.to} className={className} onClick={() => setMenuOpen(false)}>
                      <Icon className="h-4 w-4" /> {action.label}
                    </Link>
                  );
                }
                if (action.href) {
                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      target="_blank"
                      rel="noreferrer"
                      className={className}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Icon className="h-4 w-4" /> {action.label}
                    </a>
                  );
                }
                return (
                  <button
                    key={action.label}
                    type="button"
                    className={className}
                    disabled={action.disabled}
                    onClick={() => {
                      setMenuOpen(false);
                      action.onClick?.();
                    }}
                  >
                    <Icon className={`h-4 w-4 ${action.label === 'Re-analyze' && busy ? 'animate-spin' : ''}`} />
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* language ribbon */}
      <div className="flex h-1.5 w-full">
        {(repository.chartData?.languageDistribution || []).slice(0, 6).map((lang) => (
          <span
            key={lang.language}
            title={`${lang.language} — ${lang.percentage}%`}
            style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
            className="transition-all duration-500"
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1 p-5 pt-4 text-center">
        <Stat icon={Star} value={formatNumber(repository.stars)} label="Stars" tone="text-amber-500" />
        <Stat icon={GitFork} value={formatNumber(repository.forks)} label="Forks" tone="text-aqua-600" />
        <Stat
          icon={UsersRound}
          value={formatNumber(repository.contributorCount)}
          label="Contrib."
          tone="text-mint-600"
        />
        <Stat
          icon={Activity}
          value={formatNumber(repository.commitStats?.commits30Days)}
          label="30d commits"
          tone="text-coral-500"
        />
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-iris-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <ActivityBadge level={activityLevel} score={activityScore} size="sm" />
          {primary && (
            <span className="chip bg-iris-50 text-iris-700">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: primary.color }} />
              {primary.language}
              {secondary ? ` +${repository.chartData.languageDistribution.length - 1}` : ''}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft/60">
          <Clock3 className="h-3 w-3" />
          {formatRelative(repository.lastAnalyzedAt)}
        </span>
      </div>

      <div className="flex gap-2 px-5 pb-5 pt-1">
        <Link to={`/repositories/${repository._id}`} className="btn-primary btn-sm flex-1">
          View Analytics
        </Link>
        <button
          type="button"
          onClick={() => onReanalyze?.(repository)}
          disabled={busy}
          className="btn-secondary btn-sm"
          title="Fetch fresh data from GitHub"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} />
          {busy ? 'Refreshing…' : 'Re-analyze'}
        </button>
      </div>
    </article>
  );
}

function Stat({ icon: Icon, value, label, tone }) {
  return (
    <div className="rounded-xl px-1 py-2 transition-colors duration-200 group-hover:bg-iris-50/60">
      <span className={`flex items-center justify-center gap-1 font-display text-base font-bold ${tone}`}>
        <Icon className="h-3.5 w-3.5" />
        {value}
      </span>
      <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-ink-soft/55">
        {label}
      </span>
    </div>
  );
}