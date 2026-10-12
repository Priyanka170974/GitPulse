import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Github,
  LayoutDashboard,
  PlayCircle,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

import CodeFlow from '../components/CodeFlow.jsx';
import PulseRing from '../components/PulseRing.jsx';
import SectionHeading from '../components/SectionHeading.jsx';
import CustomTooltip from '../charts/CustomTooltip.jsx';
import { FEATURES, HOW_IT_WORKS, TECH_STACK } from '../utils/constants.js';
import { FEATURE_ICONS, TECH_ICONS } from '../utils/icons.js';

/* ------------------------------------------------------------------------
 * The values below are ILLUSTRATIVE DEMO DATA used only for the landing page
 * preview. They are clearly labelled in the UI and are never mixed with real
 * GitHub data.
 * ---------------------------------------------------------------------- */
const DEMO_WAVE = [
  { label: 'Mon', commits: 4 },
  { label: 'Tue', commits: 7 },
  { label: 'Wed', commits: 5 },
  { label: 'Thu', commits: 9 },
  { label: 'Fri', commits: 6 },
  { label: 'Sat', commits: 3 },
  { label: 'Sun', commits: 5 },
];

const DEMO_LANGUAGES = [
  { language: 'JavaScript', percentage: 58, color: '#F7DF1E' },
  { language: 'TypeScript', percentage: 27, color: '#3178C6' },
  { language: 'CSS', percentage: 9, color: '#563D7C' },
  { language: 'HTML', percentage: 6, color: '#E34C26' },
];

const TONE_TEXT = {
  iris: 'text-iris-600 bg-iris-50',
  aqua: 'text-aqua-700 bg-aqua-50',
  coral: 'text-coral-600 bg-coral-50',
  mint: 'text-mint-600 bg-mint-100',
  amber: 'text-amber-500 bg-amber-100',
};

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState(0);
  const feature = FEATURES[activeFeature];

  return (
    <div>
      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-mesh opacity-60" />
        <div className="pointer-events-none absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-iris-300/25 blur-3xl animate-drift" />
        <div className="pointer-events-none absolute -right-24 top-40 h-[380px] w-[380px] rounded-full bg-aqua-300/25 blur-3xl animate-drift" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="eyebrow animate-rise">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-iris-600" />
              </span>
              GitHub Repository Intelligence
            </span>

            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-ink sm:text-6xl">
              Understand the
              <span className="text-gradient block">Pulse of Your Code.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-soft/80 sm:text-lg">
              GitPulse analyzes any public GitHub repository and turns raw repository data into useful
              visual insights — commit rhythm, language mix, contributor spread, issue health and a
              project-defined pulse score you can track over time.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="btn-primary px-6 py-3 text-[15px]">
                <PlayCircle className="h-4 w-4" /> Analyze Repository
              </Link>
              <Link to="/dashboard" className="btn-secondary px-6 py-3 text-[15px]">
                Explore Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
              {[
                { k: '10+', v: 'REST endpoints' },
                { k: '6', v: 'Recharts visualisations' },
                { k: '100%', v: 'Live GitHub data' },
              ].map((stat) => (
                <div key={stat.v} className="rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur">
                  <dt className="font-display text-xl font-extrabold text-ink">{stat.k}</dt>
                  <dd className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-soft/65">
                    {stat.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* floating preview card */}
          <div className="relative animate-rise animate-delay-200">
            <div className="pointer-events-none absolute -inset-6 rounded-[42px] bg-gradient-to-br from-iris-300/40 via-aqua-200/30 to-coral-200/40 blur-2xl" />

            <div className="card relative overflow-hidden p-6 pb-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft/60">
                    Interactive preview
                  </p>
                  <h3 className="mt-1 font-display text-lg font-bold text-ink">Dashboard preview</h3>
                </div>
                <span className="chip bg-coral-50 text-coral-600">Demo data</span>
              </div>

              <div className="mt-6 flex items-center gap-5">
                <PulseRing score={78} level="high" size={132} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">Repository pulse</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">
                    Composite of commit rhythm (35%), contributor spread (25%), update freshness (25%) and
                    issue resolution (15%).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {[
                      ['Commits', 'high'],
                      ['Contributors', 'moderate'],
                      ['Issues', 'high'],
                      ['Updates', 'moderate'],
                    ].map(([label, level]) => (
                      <span
                        key={label}
                        className={`chip ${
                          level === 'high'
                            ? 'bg-mint-100 text-mint-600'
                            : level === 'moderate'
                              ? 'bg-amber-100 text-amber-500'
                              : 'bg-coral-50 text-coral-600'
                        }`}
                      >
                        {label}: {level === 'high' ? 'High' : level === 'moderate' ? 'Moderate' : 'Low'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 h-[150px] rounded-2xl border border-iris-50 bg-white/70 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={DEMO_WAVE} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gp-hero-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#2FC9E8" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} />
                    <Tooltip content={<CustomTooltip hideLabel />} />
                    <Area
                      type="monotone"
                      dataKey="commits"
                      name="Commits"
                      stroke="#6C5CE7"
                      strokeWidth={2.5}
                      fill="url(#gp-hero-fill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-5 flex items-center gap-5">
                <div className="relative h-[110px] w-[110px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={DEMO_LANGUAGES} dataKey="percentage" innerRadius={30} outerRadius={52} stroke="none">
                        {DEMO_LANGUAGES.map((entry) => (
                          <Cell key={entry.language} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {DEMO_LANGUAGES.map((lang) => (
                    <li key={lang.language} className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-2 font-semibold text-ink">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: lang.color }} />
                        {lang.language}
                      </span>
                      <span className="font-mono text-ink-soft/70">{lang.percentage}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="relative z-10 -mt-4 ml-auto mr-4 hidden w-fit items-center gap-3 rounded-2xl border border-white/70 bg-white/95 px-4 py-3 shadow-lift backdrop-blur-xl animate-float sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-iris-aqua text-white">
                <Github className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-ink">github.com/owner/repo</p>
                <p className="text-[11px] text-ink-soft/65">→ analyzed in ~2 seconds</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================== WHAT GITPULSE DOES ======================= */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="What GitPulse does"
          title="From a GitHub URL to a story about the code"
          description="Most dashboards show numbers. GitPulse explains what those numbers mean for a specific repository, and remembers how they changed."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: Activity,
              title: 'Reads the repository',
              text: 'Stars, forks, watchers, open/closed issues, languages, contributors and the most recent commits are fetched live from the GitHub REST API — nothing is faked.',
            },
            {
              icon: Zap,
              title: 'Computes the pulse',
              text: 'The analytics service converts raw numbers into four activity indicators and one composite score, using thresholds defined by this project.',
            },
            {
              icon: LayoutDashboard,
              title: 'Explains and remembers',
              text: 'Every analysis stores a snapshot. Re-analyze later to see the timeline of stars, forks, issues and the pulse score.',
            },
          ].map(({ icon: Icon, title, text }, index) => (
            <article
              key={title}
              className="card card-hover animate-rise relative overflow-hidden p-6"
              style={{ animationDelay: `${index * 110}ms` }}
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-iris-500 to-aqua-400 text-white shadow-soft">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">{text}</p>
              <span className="absolute -bottom-6 -right-6 font-display text-7xl font-extrabold text-iris-50">
                0{index + 1}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ========================= HOW IT WORKS ========================== */}
      <section className="relative overflow-hidden bg-white/45 py-16 backdrop-blur-sm lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="How it works"
              title="One request, five moving parts"
              description="A single paste travels through the whole MERN stack. Follow the arrow on the left."
            />

            <ol className="mt-8 space-y-4">
              {HOW_IT_WORKS.map((step) => (
                <li
                  key={step.step}
                  className="group flex gap-4 rounded-2xl border border-white/70 bg-white/60 p-4 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <span className="font-mono text-sm font-bold text-iris-400 transition-colors group-hover:text-iris-600">
                    {step.step}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-soft/70">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link to="/about" className="btn-secondary mt-8">
              See the full architecture <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <CodeFlow />
        </div>
      </section>

      {/* ======================= ANALYTICS PREVIEW ======================= */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <SectionHeading
          eyebrow="Analytics preview"
          title="What you get after one analysis"
          description="Six visualisations, generated from a single GitHub API request and stored in MongoDB Atlas."
          action={
            <span className="chip border border-coral-200 bg-coral-50 text-coral-600">
              <Sparkles className="h-3 w-3" /> Screenshot-style preview · demo values
            </span>
          }
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Language distribution', text: 'Byte-accurate donut from the GitHub languages endpoint.' },
            { title: 'Commit waveform', text: 'Daily and weekly commit counts, gaps included.' },
            { title: 'Contributor activity', text: 'Who is pushing, and how the load is shared.' },
            { title: 'Issue status', text: 'Open vs closed issues, pull requests excluded.' },
            { title: 'Repository timeline', text: 'Creation, recent commits and last push.' },
            { title: 'History trend', text: 'Snapshot line chart for stars, forks and pulse.' },
          ].map((item, index) => (
            <div
              key={item.title}
              className="card card-hover animate-rise overflow-hidden p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="h-24 w-full overflow-hidden rounded-xl bg-gradient-to-br from-iris-50 via-white to-aqua-50">
                <div className="flex h-full items-end gap-1.5 p-3">
                  {[38, 62, 48, 80, 56, 92, 70, 44, 66, 58, 86, 52].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-iris-200 to-iris-500 transition-all duration-500 hover:from-aqua-300 hover:to-aqua-500"
                      style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-ink">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft/70">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================ FEATURES =========================== */}
      <section className="relative overflow-hidden py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Built to make repository analytics feel alive"
            description="Eight things GitPulse does that a plain GitHub repository page does not."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* feature switcher */}
            <div className="space-y-2">
              {FEATURES.map((item, index) => {
                const Icon = FEATURE_ICONS[item.icon] || Sparkles;
                const active = index === activeFeature;
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setActiveFeature(index)}
                    className={`group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all duration-300 ${
                      active
                        ? 'border-transparent bg-iris-aqua text-white shadow-lift'
                        : 'border-white/70 bg-white/60 text-ink hover:border-iris-200 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${
                        active ? 'bg-white/20 text-white' : TONE_TEXT[item.tone]
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold">{item.title}</span>
                      <span className={`block truncate text-xs ${active ? 'text-white/80' : 'text-ink-soft/65'}`}>
                        {item.text}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* detail panel */}
            <div className="card relative overflow-hidden p-8">
              <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-iris-200/60 to-aqua-200/50 blur-3xl" />
              <div className="relative">
                <span className={`chip ${TONE_TEXT[feature.tone]}`}>
                  {feature.title}
                </span>
                <h3 className="mt-5 font-display text-2xl font-extrabold text-ink">{feature.text.split('.')[0]}.</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft/75">
                  {feature.text.split('.').slice(1).join('.').trim()}.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    { k: 'Data source', v: 'GitHub REST API' },
                    { k: 'Stored in', v: 'MongoDB Atlas' },
                    { k: 'Rendered by', v: 'React + Recharts' },
                  ].map((item) => (
                    <div key={item.k} className="rounded-2xl border border-iris-50 bg-white/70 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-soft/55">
                        {item.k}
                      </p>
                      <p className="mt-1 text-sm font-bold text-ink">{item.v}</p>
                    </div>
                  ))}
                </div>

                <Link to="/signup" className="btn-primary mt-8">
                  Try it with your repository <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= TECH STACK ============================ */}
      <section className="bg-white/50 py-16 backdrop-blur-sm lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Technology stack"
            title="A standard, well-understood MERN stack"
            description="Nothing exotic — the point of the project is that every layer is real and readable."
          />

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TECH_STACK.map((tech, index) => {
              const Icon = TECH_ICONS[tech.icon] || Sparkles;
              return (
                <div
                  key={tech.name}
                  className="card card-hover animate-rise flex items-center gap-3 p-4"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE_TEXT[tech.tone]}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{tech.name}</p>
                    <p className="truncate text-[11px] text-ink-soft/65">{tech.role}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card mt-10 flex flex-col items-center gap-5 p-8 text-center sm:flex-row sm:text-left">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-iris-500 to-coral-400 text-white shadow-lift animate-float">
              <Github className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-xl font-bold text-ink">Ready to see a real pulse?</h3>
              <p className="mt-1 text-sm text-ink-soft/70">
                Create a free account and analyze your first repository in under a minute.
              </p>
            </div>
            <Link to="/signup" className="btn-primary">
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}