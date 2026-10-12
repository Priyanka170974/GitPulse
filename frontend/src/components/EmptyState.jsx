import { Compass } from 'lucide-react';

/** Attractive empty states used across the app. */
export default function EmptyState({
  icon: Icon = Compass,
  title = 'No repositories analyzed yet.',
  description = 'Paste a public GitHub repository URL above and GitPulse will pull its live data straight from the GitHub API.',
  action,
  className = '',
}) {
  return (
    <div
      className={`card animate-rise relative overflow-hidden px-6 py-14 text-center ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 grid-mesh opacity-70" />
      <div className="relative mx-auto max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-iris-500 to-aqua-500 text-white shadow-lift animate-float">
          <Icon className="h-7 w-7" />
        </span>
        <h3 className="mt-6 font-display text-xl font-bold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">{description}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}