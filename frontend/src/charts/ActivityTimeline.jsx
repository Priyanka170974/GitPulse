import { formatDate } from '../utils/format.js';
import { GitCommitHorizontal, Rocket, UploadCloud } from 'lucide-react';

const ICONS = {
  created: Rocket,
  commit: GitCommitHorizontal,
  push: UploadCloud,
};

const TONES = {
  created: 'bg-aqua-50 text-aqua-700 border-aqua-200',
  commit: 'bg-iris-50 text-iris-700 border-iris-200',
  push: 'bg-coral-50 text-coral-600 border-coral-200',
};

/**
 * Repository activity timeline — the real sequence of events GitHub returned.
 */
export default function ActivityTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
        No timeline events are available for this repository.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 pl-1">
      <span className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-0.5 rounded-full bg-gradient-to-b from-aqua-300 via-iris-300 to-coral-300" />

      {events.map((event, index) => {
        const Icon = ICONS[event.type] || GitCommitHorizontal;
        return (
          <li
            key={`${event.type}-${index}`}
            className="animate-rise relative flex gap-3"
            style={{ animationDelay: `${index * 55}ms` }}
          >
            <span
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-xl border shadow-sm ${TONES[event.type]}`}
            >
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 rounded-2xl border border-iris-50 bg-white/70 p-3 transition-all duration-300 hover:border-iris-200 hover:bg-white hover:shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold leading-snug text-ink">{event.label}</p>
                <span className="shrink-0 font-mono text-[10px] text-ink-soft/55">
                  {formatDate(event.date)}
                </span>
              </div>
              {event.author && (
                <p className="mt-0.5 text-[11px] text-ink-soft/65">
                  by <span className="font-semibold text-iris-600">@{event.author}</span>
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}