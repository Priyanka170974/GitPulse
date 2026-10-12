import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

/**
 * Headline metric card with an animated counter and an optional delta chip.
 */
export default function StatCard({
  icon: Icon,
  label,
  value,
  rawValue,
  hint,
  delta,
  deltaLabel = 'vs. previous',
  gradient = 'from-iris-500 to-iris-400',
  index = 0,
  loading = false,
}) {
  const DeltaIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const deltaClasses =
    delta > 0
      ? 'bg-mint-100 text-mint-600'
      : delta < 0
        ? 'bg-coral-50 text-coral-600'
        : 'bg-iris-50 text-ink-soft/70';

  return (
    <div
      className="card card-hover animate-rise relative overflow-hidden p-5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-[0.12] blur-2xl transition-opacity duration-500 hover:opacity-25`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-ink-soft/70">{label}</p>
          {loading ? (
            <div className="skeleton mt-3 h-8 w-24" />
          ) : (
            <p className="mt-2 font-display text-3xl font-extrabold leading-none text-ink">
              {value}
              {rawValue !== undefined && (
                <span className="ml-2 align-middle font-mono text-xs font-medium text-ink-soft/50">
                  {rawValue}
                </span>
              )}
            </p>
          )}
        </div>

        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-soft`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {delta !== undefined && delta !== null && (
          <span className={`chip ${deltaClasses}`}>
            <DeltaIcon className="h-3 w-3" />
            {delta > 0 ? '+' : ''}
            {delta}
          </span>
        )}
        <span className="truncate text-[11px] text-ink-soft/60">{delta !== undefined ? deltaLabel : hint}</span>
      </div>
    </div>
  );
}