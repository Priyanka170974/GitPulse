import { Outlet } from 'react-router-dom';
import { Activity, BarChart3, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/Logo.jsx';

/** Split-screen layout for the login / signup screens. */
export default function AuthLayout() {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* left — brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-iris-700 via-iris-600 to-aqua-600 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-30 grid-mesh" />
        <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-coral-400/30 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-aqua-300/25 blur-3xl animate-drift" />

        <div className="relative">
          <Logo />
          <div className="mt-10 max-w-md">
            <span className="eyebrow bg-white/15 text-white">Repository Pulse</span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.08] text-white">
              Watch how a
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-aqua-200">
                repository breathes
              </span>
            </h1>
            <p className="mt-5 text-sm leading-relaxed text-white/75">
              GitPulse pulls live data from the GitHub REST API, turns it into indicators, insights and
              interactive charts, and keeps a snapshot of every analysis so you can see the trend.
            </p>
          </div>

          <ul className="mt-10 space-y-4">
            {[
              { icon: Activity, title: 'Commit rhythm', text: 'Daily and weekly waveforms from real commit timestamps.' },
              { icon: BarChart3, title: 'Interactive charts', text: 'Languages, contributors, issues and history.' },
              { icon: ShieldCheck, title: 'Private by design', text: 'Every query is scoped to your JWT user id.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3 text-white/85">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white">{title}</span>
                  <span className="block text-xs text-white/65">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-white/55">
          Analytics shown in GitPulse are project-defined, not official GitHub metrics.
        </p>
      </div>

      {/* right — form panel */}
      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="card p-7 sm:p-9">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-iris-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-iris-600">
              <Sparkles className="h-3 w-3" /> {import.meta.env.VITE_APP_NAME || 'GitPulse'}
            </div>
            <Outlet />
          </div>

          <p className="mt-6 text-center text-xs text-ink-soft/60">
            GitPulse is a full-stack MERN demonstration project. Data shown comes from the public GitHub
            API.
          </p>
        </div>
      </div>
    </div>
  );
}