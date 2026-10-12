import { levelTheme } from '../utils/format.js';

/**
 * The GitPulse score ring.
 * Three rotating arcs + a static progress arc that shows the score (0-100).
 */
export default function PulseRing({
  score = 0,
  level = 'unknown',
  size = 148,
  stroke = 11,
  label = 'GitPulse score',
  sublabel = 'Project-defined',
  animate = true,
  className = '',
}) {
  const theme = levelTheme(level);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const dash = (safeScore / 100) * circumference;

  return (
    <div className={`relative grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id="gp-ring-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="55%" stopColor="#8B7DF3" />
            <stop offset="100%" stopColor="#2FC9E8" />
          </linearGradient>
          <linearGradient id="gp-ring-gradient-warm" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#FF6F8F" />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EDEAFB"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={level === 'moderate' ? 'url(#gp-ring-gradient-warm)' : 'url(#gp-ring-gradient)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>

      {/* rotating radar arcs */}
      {animate && (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + stroke / 2 + 3}
            fill="none"
            stroke={theme.stroke}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="34 999"
            className="animate-[spin_3.4s_linear_infinite]"
            style={{ transformOrigin: 'center', opacity: 0.75 }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + stroke / 2 + 9}
            fill="none"
            stroke="#8B7DF3"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="14 999"
            className="animate-[spin_5.6s_linear_infinite_reverse]"
            style={{ transformOrigin: 'center', opacity: 0.5 }}
          />
        </svg>
      )}

      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-display text-3xl font-extrabold leading-none text-ink">
            {Math.round(safeScore)}
          </p>
          <p className={`mt-1 text-[11px] font-bold uppercase tracking-[0.16em] ${theme.text}`}>
            {theme.label}
          </p>
        </div>
      </div>

      <span className="sr-only">
        {label}: {Math.round(safeScore)} out of 100 — {theme.label}. {sublabel}.
      </span>
    </div>
  );
}