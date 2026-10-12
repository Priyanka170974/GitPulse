import { Info } from 'lucide-react';

/** Shared wrapper so every chart on GitPulse looks like part of the same product. */
export default function ChartCard({
  title,
  description,
  icon: Icon,
  action,
  info,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section className={`card animate-rise flex flex-col p-5 ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="flex items-center gap-1.5 font-display text-base font-bold text-ink">
              {title}
              {info && (
                <span className="group relative inline-flex cursor-help">
                  <Info className="h-3.5 w-3.5 text-ink-soft/40" />
                  <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-xl border border-iris-100 bg-white p-2.5 text-[11px] font-normal leading-relaxed text-ink-soft opacity-0 shadow-lift transition-opacity duration-200 group-hover:opacity-100">
                    {info}
                  </span>
                </span>
              )}
            </h3>
            {description && <p className="mt-0.5 text-xs text-ink-soft/65">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>

      <div className={`min-w-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}