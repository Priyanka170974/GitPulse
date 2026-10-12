import { Lightbulb, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { toneTheme } from '../utils/format.js';

const ICONS = {
  positive: TrendingUp,
  warning: TrendingDown,
  neutral: Info,
  info: Lightbulb,
};

/** One "Repository Insight" card produced by the analytics service. */
export default function InsightCard({ insight, index = 0 }) {
  const Icon = ICONS[insight?.tone] || Lightbulb;

  return (
    <div
      className={`animate-rise group relative overflow-hidden rounded-2xl border bg-white/80 p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift ${toneTheme(insight?.tone)}`}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-current opacity-[0.07] blur-xl" />
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/80 shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h4 className="text-sm font-bold leading-snug">{insight?.title}</h4>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft/80">{insight?.detail}</p>
        </div>
      </div>
    </div>
  );
}