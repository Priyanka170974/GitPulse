import {
  Activity,
  Cloud,
  Database,
  Github,
  LayoutDashboard,
} from 'lucide-react';
import { PIPELINE_STEPS } from '../utils/constants.js';

const ICONS = { Github, Cloud, Activity, Database, LayoutDashboard };

/**
 * The "How data flows" diagram on the landing page and About page.
 * GitHub Repository → GitHub API → GitPulse Analytics → MongoDB → Dashboard
 */
export default function CodeFlow({ compact = false }) {
  return (
    <div className="relative">
      <div className="absolute left-[27px] top-4 hidden h-[calc(100%-2rem)] w-0.5 rounded-full bg-gradient-to-b from-iris-400 via-aqua-400 to-coral-400 sm:block" />

      <ol className="space-y-4">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = ICONS[step.icon] || Activity;
          return (
            <li
              key={step.title}
              className="animate-rise relative flex gap-4 sm:gap-5"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white bg-gradient-to-br from-iris-500 via-iris-400 to-aqua-400 text-white shadow-soft">
                <Icon className="h-6 w-6" />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white font-mono text-[10px] font-bold text-iris-600 shadow-sm">
                  {index + 1}
                </span>
              </span>

              <div className={`flex-1 rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft ${compact ? '' : 'sm:p-5'}`}>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-base font-bold text-ink">{step.title}</h3>
                  {index < PIPELINE_STEPS.length - 1 && (
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-soft/45">
                      ↓ next
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft/70">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}