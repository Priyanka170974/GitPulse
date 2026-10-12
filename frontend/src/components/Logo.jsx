import { Link } from 'react-router-dom';

/**
 * GitPulse logo — a radar sweep around a heartbeat line.
 * Doubles as the landing page link and the sidebar brand.
 */
export default function Logo({ compact = false, to = '/', className = '' }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2.5 ${className}`}>
      <span className="relative grid h-10 w-10 shrink-0 place-items-center">
        <span className="absolute inset-0 rounded-2xl bg-iris-aqua opacity-90 shadow-soft transition-transform duration-300 group-hover:scale-105" />
        <span className="absolute inset-0 rounded-2xl bg-iris-aqua opacity-40 animate-pulse-ring" />
        <svg viewBox="0 0 40 40" className="relative h-10 w-10" aria-hidden="true">
          <defs>
            <linearGradient id="gp-logo-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#CFF6FE" />
            </linearGradient>
          </defs>
          <circle cx="20" cy="20" r="13" fill="none" stroke="url(#gp-logo-stroke)" strokeOpacity="0.35" strokeWidth="1.5" />
          <path
            d="M7 20a13 13 0 0 1 26 0"
            fill="none"
            stroke="url(#gp-logo-stroke)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 22h4l2.6-6.4 3.4 11 3-7.4 2.2 3.8H33"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="33" cy="22" r="2" fill="#ffffff" />
        </svg>
      </span>

      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-xl font-extrabold tracking-tight text-ink">
            Git<span className="text-gradient">Pulse</span>
          </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-soft/70">
            Repo Intelligence
          </span>
        </span>
      )}
    </Link>
  );
}