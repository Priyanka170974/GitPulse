import {
  Activity,
  CalendarClock,
  FileText,
  GitBranch,
  HardDrive,
  History,
  Info,
  Rocket,
  UploadCloud,
} from 'lucide-react';
import {
  formatBytes,
  formatFullTimestamp,
  formatLocalDateTime,
  formatRelative,
  formatTimeZoneLabel,
  toLocalDate,
} from '../utils/format.js';

/**
 * "Repository information" — the factual, GitHub-sourced metadata block.
 *
 * IMPORTANT (requirement): every timestamp here is the value GitHub reports
 * for the repository itself (or the moment GitPulse last analysed it).
 *   • Repository Created  → GitHub `created_at`  (NOT the analysis date)
 *   • Last Push           → GitHub `pushed_at`
 *   • GitHub Updated      → GitHub `updated_at`
 *   • Last Analysed       → GitPulse (when this record was refreshed)
 * They are deliberately labelled so the two can never be confused.
 */

function Field({ icon: Icon, label, value, secondary, tooltip, accent = 'text-ink-soft/60', highlighted }) {
  const isMissing = !value;

  return (
    <div
      title={tooltip}
      className={`group rounded-2xl border p-3.5 transition-all duration-300 ${
        highlighted
          ? 'border-iris-200 bg-gradient-to-br from-iris-50 via-white to-aqua-50/60 shadow-soft'
          : 'border-iris-50 bg-white/70 hover:border-iris-200 hover:shadow-soft'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${
            highlighted ? 'bg-iris-500 text-white' : 'bg-iris-50 text-ink-soft/70'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/60">{label}</p>

          <p
            className={`mt-1 text-sm font-bold leading-snug ${
              isMissing ? 'text-ink-soft/45' : highlighted ? 'text-ink' : 'text-ink'
            }`}
          >
            {isMissing ? 'Not available' : value}
          </p>

          {secondary && (
            <p className="mt-0.5 text-[11px] leading-snug text-ink-soft/55">{secondary}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RepositoryInfoCard({ repository }) {
  if (!repository) return null;

  const timezone = formatTimeZoneLabel();

  /* --- Repository Created: the GitHub `created_at` timestamp --- */
  const created = toLocalDate(repository.createdOnGitHub);
  const createdLabel = formatLocalDateTime(created);

  /* --- Other GitHub timestamps --- */
  const pushedLabel = formatLocalDateTime(repository.lastPushedAt);
  const updatedLabel = formatLocalDateTime(repository.githubUpdatedAt);
  const analyzedLabel = formatLocalDateTime(repository.lastAnalyzedAt);

  return (
    <section className="card animate-rise p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
            <Info className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Repository information</h3>
            <p className="mt-0.5 text-xs text-ink-soft/65">
              Facts reported by GitHub for this repository · times shown in your timezone
            </p>
          </div>
        </div>

        <span className="chip border border-iris-100 bg-iris-50 text-iris-600">
          <Rocket className="h-3 w-3" /> from GitHub
        </span>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {/* ------------- the field this change is about ------------- */}
        <Field
          highlighted
          icon={CalendarClock}
          label="Repository Created"
          value={createdLabel}
          secondary={
            created ? `Your timezone · ${formatRelative(created)}` : 'GitHub did not report a creation date'
          }
          tooltip={created ? formatFullTimestamp(created) : 'No creation date returned by the GitHub API'}
        />

        <Field
          icon={UploadCloud}
          label="Last Push"
          value={pushedLabel}
          secondary={pushedLabel ? `Latest push · ${formatRelative(repository.lastPushedAt)}` : '—'}
          tooltip={formatFullTimestamp(repository.lastPushedAt)}
        />

        <Field
          icon={History}
          label="GitHub Updated"
          value={updatedLabel}
          secondary={updatedLabel ? `Repository metadata changed ${formatRelative(repository.githubUpdatedAt)}` : '—'}
          tooltip={formatFullTimestamp(repository.githubUpdatedAt)}
        />

        <Field
          icon={Activity}
          label="Last Analysed by GitPulse"
          value={analyzedLabel}
          secondary={
            repository.analysisCount
              ? `${repository.analysisCount} analys${repository.analysisCount === 1 ? 'is' : 'es'} · not the creation date`
              : '—'
          }
          tooltip={formatFullTimestamp(repository.lastAnalyzedAt)}
        />

        <Field
          icon={GitBranch}
          label="Default Branch"
          value={repository.defaultBranch || null}
          secondary="Branch GitHub points to"
        />

        <Field
          icon={FileText}
          label="License"
          value={repository.license || null}
          secondary={repository.license ? 'License reported by GitHub' : 'No license detected'}
        />

        <Field
          icon={HardDrive}
          label="Repository Size"
          value={formatBytes(repository.sizeKb)}
          secondary="Size reported by GitHub (KB → MB)"
        />

        <Field
          icon={History}
          label="Timezone Used"
          value={timezone}
          secondary="All timestamps on this page are rendered locally"
        />
      </div>

      <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-iris-50/70 px-3 py-2 text-[11px] leading-relaxed text-ink-soft/70">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-iris-500" />
        <span>
          <strong className="text-iris-700">Repository Created</strong> is the exact timestamp GitHub
          returned in the repository&apos;s <code className="font-mono">created_at</code> field when GitPulse
          analysed it — it is <strong className="text-iris-700">not</strong> the analysis date, the last commit
          date, the last push date or the date this record was saved in MongoDB. Hover any field to see the raw
          UTC value.
        </span>
      </p>
    </section>
  );
}