import { formatNumber } from '../utils/format.js';

/** Glass tooltip shared by every Recharts chart in GitPulse. */
export default function CustomTooltip({ active, payload, label, valueFormatter, labelFormatter, hideLabel = false }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[150px] rounded-2xl border border-white/80 bg-white/95 p-3 shadow-lift backdrop-blur-xl">
      {!hideLabel && label !== undefined && (
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">
          {labelFormatter ? labelFormatter(label, payload) : label}
        </p>
      )}
      <ul className="space-y-1.5">
        {payload.map((entry, index) => (
          <li key={`${entry.dataKey}-${index}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-ink-soft">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color || entry.payload?.fill || '#6C5CE7' }}
              />
              {entry.name}
            </span>
            <span className="font-mono font-semibold text-ink">
              {valueFormatter
                ? valueFormatter(entry.value, entry)
                : typeof entry.value === 'number'
                  ? formatNumber(entry.value)
                  : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}