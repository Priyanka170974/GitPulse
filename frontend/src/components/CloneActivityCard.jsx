import { Download, Info, LockKeyhole, TriangleAlert } from 'lucide-react';
import CloneActivityChart from '../charts/CloneActivityChart.jsx';
import { formatNumber } from '../utils/format.js';

/**
 * Clone Activity — a new, self-contained section for the repository
 * analytics page. It reuses the existing card/chart/typography system and
 * adds nothing to any other part of the app.
 *
 * GitHub's traffic API provides AGGREGATE clone counts only. GitPulse does
 * not — and cannot — identify individual cloners, and says so in the UI.
 */

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-iris-50 bg-white/70 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/60">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold leading-none text-ink">
        {formatNumber(value)}
      </p>
      {hint && <p className="mt-1 text-[11px] text-ink-soft/55">{hint}</p>}
    </div>
  );
}

function Notice({ icon: Icon, title, message, tone = 'neutral' }) {
  const tones = {
    neutral: 'border-iris-100 bg-iris-50/60 text-ink-soft/80',
    warning: 'border-amber-400/40 bg-amber-100/50 text-amber-500',
    error: 'border-coral-200 bg-coral-50/60 text-coral-600',
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tones[tone]}`}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-xs font-bold">{title}</p>
          <p className="mt-1 text-xs leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function CloneActivityCard({ cloneAnalytics, loading = false }) {
  /* ----------------------------- loading ---------------------------- */
  if (loading) {
    return (
      <section className="card animate-rise p-5 sm:p-6">
        <div className="skeleton h-4 w-44" />
        <div className="skeleton mt-2 h-3 w-72" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
          <div className="skeleton h-20" />
        </div>
        <div className="skeleton mt-4 h-[240px]" />
      </section>
    );
  }

  const hasData = cloneAnalytics && cloneAnalytics.available === true;

  /* -------------------------- unavailable --------------------------- */
  if (!hasData) {
    const reason = cloneAnalytics?.reason;
    const title =
      reason === 'token_invalid'
        ? 'GitHub rejected the server token'
        : reason === 'cache_mismatch'
          ? 'Clone data discarded for safety'
          : reason === 'insufficient_permissions' || reason === 'no_token'
            ? 'Clone analytics unavailable — GitHub requires repository admin access'
            : reason === 'rate_limited'
              ? 'Clone analytics skipped — GitHub rate limit reached'
              : reason === 'network_error'
                ? 'Could not reach the GitHub API'
                : reason === 'traffic_not_found'
                  ? 'Clone traffic data not returned'
                  : reason === 'error'
                    ? 'Could not load clone analytics'
                    : 'Clone analytics not available';

    /* Real reason + HTTP status + GitHub's own message, so the error is never hidden. */
    const diagnostics = [];
    if (cloneAnalytics?.httpStatus) diagnostics.push(`GitHub HTTP ${cloneAnalytics.httpStatus}`);
    if (reason) diagnostics.push(`reason: ${reason}`);
    if (cloneAnalytics?.githubMessage) diagnostics.push(cloneAnalytics.githubMessage);
    const diagnosticText = diagnostics.join('  ·  ');

    return (
      <section className="card animate-rise p-5 sm:p-6">
        <header className="mb-4 flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
            <Download className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Clone Activity</h3>
            <p className="mt-0.5 text-xs text-ink-soft/65">
              Aggregate clone statistics from the GitHub repository traffic API
            </p>
          </div>
        </header>

        <Notice
          icon={reason === 'error' || reason === 'token_invalid' ? TriangleAlert : LockKeyhole}
          tone={reason === 'error' || reason === 'token_invalid' ? 'error' : 'neutral'}
          title={title}
          message={
            cloneAnalytics?.message ||
            'GitHub did not return clone statistics for this repository.'
          }
        />

        {diagnosticText && (
          <p className="mt-3 rounded-xl border border-iris-100 bg-white/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-soft/70">
            {diagnosticText}
          </p>
        )}
      </section>
    );
  }

  /* ---------------------------- available --------------------------- */
  const daily = cloneAnalytics.daily || [];
  const totalClones = cloneAnalytics.totalClones ?? daily.reduce((s, d) => s + (d.count || 0), 0);
  const uniqueCloners = cloneAnalytics.uniqueCloners ?? daily.reduce((s, d) => s + (d.uniques || 0), 0);
  const activeDays = daily.filter((d) => d.count > 0).length;
  const dailyAverage = daily.length ? Math.round((totalClones / daily.length) * 10) / 10 : 0;

  /* How much of the window GitHub actually reported (vs. zero-filled by GitPulse). */
  const reportedDays =
    cloneAnalytics.reportedDays ?? daily.filter((d) => d.filled !== true).length;
  const windowDays = cloneAnalytics.windowDays || daily.length;
  const partialWindow = reportedDays > 0 && reportedDays < windowDays;

  /* Fresh vs historical — computed on the server, read-only here. */
  const capturedAt = cloneAnalytics.fetchedAt ? new Date(cloneAnalytics.fetchedAt) : null;
  const capturedLabel = capturedAt
    ? capturedAt.toLocaleString(undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <section className="card animate-rise p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
            <Download className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Clone Activity</h3>
            <p className="mt-0.5 text-xs text-ink-soft/65">
              Aggregate clone statistics from the GitHub repository traffic API · last{' '}
              {windowDays} days
            </p>
          </div>
        </div>

        <span className="chip border border-iris-100 bg-iris-50 text-iris-600">
          {activeDays} active day{activeDays === 1 ? '' : 's'}
        </span>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Total clones" value={totalClones} hint="Sum of daily clone events" />
        <Tile label="Unique cloners" value={uniqueCloners} hint="Distinct cloners (GitHub aggregate)" />
        <Tile label="Daily average" value={dailyAverage} hint="Clones per day over the window" />
      </div>

      <div className="mt-4">
        <CloneActivityChart daily={daily} />
      </div>

      {/* Fresh vs historical, and how many days GitHub actually reported. */}
      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-soft/65">
        {capturedLabel && (
          <span
            className={
              cloneAnalytics.isStale
                ? 'rounded-md border border-amber-400/40 bg-amber-100/50 px-2 py-0.5 font-medium text-amber-500'
                : 'rounded-md border border-mint-400/40 bg-mint-100 px-2 py-0.5 font-medium text-mint-600'
            }
          >
            {cloneAnalytics.isStale ? 'Historical snapshot' : 'Fresh from GitHub'} · captured {capturedLabel}
          </span>
        )}
        <span>
          GitHub reported {reportedDays} of {windowDays} days
          {partialWindow ? ' · remaining days had no data and are shown as zero' : ''}
        </span>
      </p>

      <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-iris-50/70 px-3 py-2 text-[11px] leading-relaxed text-ink-soft/70">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-iris-500" />
        <span>
          GitHub reports these as <strong className="text-iris-700">aggregate clone statistics</strong> for
          the repository. GitHub does not disclose which accounts cloned a repository, so GitPulse cannot and
          does not identify individual cloners.
        </span>
      </p>
    </section>
  );
}