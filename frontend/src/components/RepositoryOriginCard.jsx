import { BadgeCheck, ExternalLink, GitFork, Info, TriangleAlert } from 'lucide-react';
import { truncate } from '../utils/format.js';

/**
 * Repository Origin — an additive section for the repository analytics page.
 *
 * It reports ONLY what GitHub itself states in the repository metadata:
 *   • official fork link (GitHub's own `source` / `parent`)
 *   • or "GitHub has no link" — never a guess.
 * No styling is invented here; the card reuses the existing tokens
 * (card / chip / iris palette / animate-rise) of the surrounding page.
 */

function Notice({ icon: Icon, title, message }) {
  return (
    <div className="rounded-2xl border border-iris-100 bg-iris-50/60 px-4 py-4">
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft/70" />
        <div>
          <p className="text-xs font-bold text-ink">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft/80">{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function RepositoryOriginCard({ originInfo, loading = false }) {
  if (loading) {
    return (
      <section className="card animate-rise p-5 sm:p-6">
        <div className="skeleton h-4 w-48" />
        <div className="skeleton mt-2 h-3 w-80" />
        <div className="skeleton mt-5 h-20" />
      </section>
    );
  }

  const verified = originInfo && originInfo.verified === true && Boolean(originInfo.originFullName);

  return (
    <section className="card animate-rise p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
            <GitFork className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-base font-bold text-ink">Repository Origin</h3>
            <p className="mt-0.5 text-xs text-ink-soft/65">
              Upstream project reported by GitHub for this repository
            </p>
          </div>
        </div>

        <span className="chip border border-iris-100 bg-iris-50 text-iris-600">from GitHub</span>
      </header>

      {verified ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip border border-mint-400/40 bg-mint-100 text-mint-600">
              <BadgeCheck className="h-3 w-3" /> Official fork link
            </span>
            <span className="chip border border-iris-100 bg-white text-ink-soft">
              forked from{' '}
              <a
                href={originInfo.originUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-iris-600 transition hover:text-iris-700"
              >
                {originInfo.originFullName}
              </a>
            </span>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-iris-50 bg-white/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/60">
                Original repository
              </p>
              <p className="mt-1 truncate text-sm font-bold text-ink">{originInfo.originFullName}</p>
            </div>

            <div className="rounded-2xl border border-iris-50 bg-white/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/60">
                Original owner
              </p>
              <p className="mt-1 truncate text-sm font-bold text-ink">{originInfo.originOwner || '—'}</p>
            </div>

            <div className="rounded-2xl border border-iris-50 bg-white/70 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft/60">
                Original URL
              </p>
              {originInfo.originUrl ? (
                <a
                  href={originInfo.originUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline mt-1 inline-flex items-center gap-1 truncate text-sm font-bold text-iris-600 transition hover:text-iris-700"
                >
                  <span className="truncate">{originInfo.originUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <p className="mt-1 text-sm font-bold text-ink-soft/45">—</p>
              )}
            </div>
          </dl>

          {originInfo.originDescription && (
            <p className="mt-3 text-xs leading-relaxed text-ink-soft/70">
              {truncate(originInfo.originDescription, 220)}
            </p>
          )}
        </>
      ) : (
        <Notice
          icon={originInfo?.reason === 'incomplete_metadata' ? TriangleAlert : Info}
          title={
            originInfo?.reason === 'incomplete_metadata'
              ? 'Fork flag set, but no origin returned'
              : 'No official origin link on GitHub'
          }
          message={
            originInfo?.message ||
            'GitHub does not record a source repository for this project, so GitPulse cannot name one.'
          }
        />
      )}

      <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-iris-50/70 px-3 py-2 text-[11px] leading-relaxed text-ink-soft/70">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-iris-500" />
        <span>
          An origin is shown only when GitHub itself records a fork link for this repository. Repositories
          that were copied without using GitHub&apos;s fork flow leave no link, so GitPulse reports
          &ldquo;no origin found&rdquo; rather than guessing a source.
        </span>
      </p>
    </section>
  );
}