import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUp,
  Boxes,
  Cloud,
  Database,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Lock,
  Route,
  Server,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import { ARCHITECTURE_FLOW, FUTURE_IMPROVEMENTS, SCORE_DISCLAIMER, TECH_STACK } from '../utils/constants.js';

const LAYER_PURPOSE = [
  {
    icon: LayoutDashboard,
    name: 'React',
    text: 'Builds the interface from reusable components. Hooks hold auth state, toasts and the repository library; every screen reads from the API service layer instead of calling Axios directly.',
  },
  {
    icon: Server,
    name: 'Node.js + Express',
    text: 'The runtime and the REST layer. Routes stay thin — they only map a URL to a controller function and attach the right middleware.',
  },
  {
    icon: KeyRound,
    name: 'JWT',
    text: 'A signed token containing only the user id and role. The client attaches it to every protected request and the server verifies its signature on arrival.',
  },
  {
    icon: Lock,
    name: 'bcryptjs',
    text: 'Hashes passwords with 12 salt rounds before they are stored. Plain-text passwords never reach the database, and the password field is excluded from queries by default.',
  },
  {
    icon: Cloud,
    name: 'GitHub REST API',
    text: 'The single source of truth. GitPulse reads repository metadata, languages, contributors, commits, issues and pull requests from GitHub — never from a made-up data set.',
  },
  {
    icon: Database,
    name: 'Mongoose + MongoDB Atlas',
    text: 'Models the User, Repository and AnalysisHistory collections with indexes, virtuals and a unique compound index that guarantees one repository per user.',
  },
  {
    icon: LineChart,
    name: 'Recharts',
    text: 'Renders the donut, area, bar and line charts. Each series is already shaped by the analytics service, so the frontend never has to reshape data.',
  },
  {
    icon: ShieldCheck,
    name: 'Analytics service',
    text: 'Converts raw GitHub numbers into four activity indicators, one composite pulse score and a set of written insights — all from real data, with thresholds documented in the UI.',
  },
];

const SCORE_LAYERS = [
  { layer: 'Commit activity', weight: '35%', rule: 'Commits pushed in the last 30 days (high ≥ 20, moderate ≥ 8).' },
  { layer: 'Contributor activity', weight: '25%', rule: 'Distinct commit authors in the last 90 days (high ≥ 8, moderate ≥ 3).' },
  { layer: 'Update frequency', weight: '25%', rule: 'Days since the last push (high ≤ 1 day, moderate ≤ 7 days).' },
  { layer: 'Issue activity', weight: '15%', rule: 'Share of sampled issues that are closed (high ≥ 60%, moderate ≥ 30%).' },
];

export default function About() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      {/* ------------------------------ hero ------------------------------ */}
      <section className="text-center">
        <span className="eyebrow">
          <Boxes className="h-3 w-3" /> About GitPulse
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          A GitHub repository analytics dashboard built with the MERN stack
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-soft/75">
          GitPulse takes a public GitHub repository URL, fetches its live data from the GitHub REST API,
          converts it into readable analytics, stores it in MongoDB Atlas, and renders it back as an
          interactive dashboard. This page explains how the pieces fit together — it is written to be shown
          during a project presentation.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/signup" className="btn-primary">
            Try GitPulse <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            Open dashboard
          </Link>
        </div>
      </section>

      {/* --------------------------- problem ------------------------------- */}
      <section className="mt-16 grid gap-5 md:grid-cols-3">
        {[
          {
            icon: Gauge,
            title: 'The problem',
            text: 'A GitHub repository page shows raw numbers. It does not tell you whether the project is actively maintained, who is doing the work, or how the numbers moved since last month.',
          },
          {
            icon: Boxes,
            title: 'The solution',
            text: 'GitPulse reads those same numbers through the API, computes project-defined indicators, explains them in plain language and keeps a timestamped snapshot of every analysis.',
          },
          {
            icon: UsersRound,
            title: 'Why it is a MERN project',
            text: 'React handles the interactive layer, Express exposes a REST API, MongoDB stores user-scoped data and JSON moves between them. Each layer is small, readable and replaceable.',
          },
        ].map(({ icon: Icon, title, text }, index) => (
          <article
            key={title}
            className="card card-hover animate-rise p-6"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-iris-500 to-aqua-400 text-white shadow-soft">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">{text}</p>
          </article>
        ))}
      </section>

      {/* -------------------------- architecture -------------------------- */}
      <section className="mt-20">
        <SectionHeading
          eyebrow="Architecture"
          title="How a repository URL becomes a dashboard"
          description="Follow the path of one analyze request from the browser all the way to MongoDB Atlas and back."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          {/* vertical flow */}
          <div className="card p-6">
            <ol className="space-y-1.5">
              {ARCHITECTURE_FLOW.map((step, index) => (
                <li key={step} className="animate-rise" style={{ animationDelay: `${index * 45}ms` }}>
                  <div className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 transition-colors duration-200 hover:border-iris-100 hover:bg-iris-50/60">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-iris-50 font-mono text-[11px] font-bold text-iris-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-sm font-semibold text-ink">{step}</span>
                    {index < ARCHITECTURE_FLOW.length - 1 && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-soft/35">
                        ↓
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* layer explanations */}
          <div className="grid gap-3 sm:grid-cols-2 lg:content-start">
            {LAYER_PURPOSE.map(({ icon: Icon, name, text }) => (
              <div key={name} className="card animate-rise p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-iris-50 text-iris-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-sm font-bold text-ink">{name}</h3>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-soft/70">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------ folder structure ----------------------- */}
      <section className="mt-20 grid gap-5 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Route className="h-4 w-4 text-iris-500" /> Folder structure
          </h3>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink p-5 font-mono text-[11px] leading-relaxed text-iris-100">
{`GitPulse/
├── frontend/
│   └── src/
│       ├── components/   reusable UI pieces
│       ├── pages/        one file per screen
│       ├── layouts/      public · auth · dashboard shells
│       ├── services/     axios client + token storage
│       ├── context/      auth + toast providers
│       ├── hooks/        debounce, counters, library
│       ├── charts/       Recharts visualisations
│       └── utils/        formatting + constants
└── backend/
    └── src/
        ├── config/       env validation + Mongo
        ├── routes/       URL → controller
        ├── controllers/  req/res logic
        ├── services/     GitHub + analytics logic
        ├── models/       Mongoose schemas
        ├── middleware/   JWT, admin, errors
        ├── utils/        ApiError, asyncHandler
        └── server.js`}
          </pre>
        </div>

        <div className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <KeyRound className="h-4 w-4 text-iris-500" /> Authentication flow
          </h3>
          <ol className="mt-4 space-y-2.5 text-sm text-ink-soft/80">
            {[
              'Signup posts name, email and password to /api/auth/register.',
              'The backend hashes the password with bcrypt (12 rounds) and stores the user in MongoDB Atlas.',
              'A JWT is signed with the payload { userId, role } and returned to the client.',
              'The client stores the token and attaches it as "Authorization: Bearer <token>" on every request.',
              'authMiddleware verifies the signature, loads the user and sets req.user.',
              'Every repository query is filtered by req.user.userId — this is the data-isolation guarantee.',
              'Logout clears the token on the client; the API layer also listens for 401 responses and signs the user out automatically.',
            ].map((line, index) => (
              <li key={line} className="flex gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-iris-50 font-mono text-[10px] font-bold text-iris-600">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{line}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------- score explainer ----------------------- */}
      <section className="mt-20">
        <SectionHeading
          eyebrow="Transparency"
          title="How the GitPulse score is calculated"
          description="The pulse score and the High / Moderate / Low labels are defined by this project — they are not official GitHub metrics."
        />

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {SCORE_LAYERS.map((row) => (
            <div key={row.layer} className="card card-hover p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">{row.layer}</h3>
                <span className="chip bg-iris-50 font-mono text-iris-600">{row.weight}</span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink-soft/70">{row.rule}</p>
            </div>
          ))}
        </div>

        <p className="mt-5 flex items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50/70 px-4 py-3 text-xs leading-relaxed text-coral-600">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          {SCORE_DISCLAIMER}
        </p>
      </section>

      {/* --------------------------- tech stack -------------------------- */}
      <section className="mt-20">
        <SectionHeading eyebrow="Stack" title="Technologies used" />
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {TECH_STACK.map((tech, index) => (
            <div
              key={tech.name}
              className="card card-hover animate-rise p-4"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <p className="font-display text-sm font-bold text-ink">{tech.name}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-soft/65">{tech.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------- future work ------------------------- */}
      <section className="mt-20">
        <SectionHeading
          eyebrow="Roadmap"
          title="Future improvements"
          description="What the next versions of GitPulse would add."
        />
        <ul className="mt-6 grid gap-3 md:grid-cols-2">
          {FUTURE_IMPROVEMENTS.map((item, index) => (
            <li
              key={item}
              className="card animate-rise flex items-start gap-3 p-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-iris-500" />
              <span className="text-sm leading-relaxed text-ink-soft/80">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-iris-600 to-aqua-600 p-8 text-center text-white shadow-lift sm:flex-row sm:justify-between sm:text-left">
        <div>
          <h3 className="font-display text-xl font-bold">Want to see it with real data?</h3>
          <p className="mt-1 text-sm text-white/75">
            Create an account and paste any public GitHub repository URL.
          </p>
        </div>
        <Link
          to="/signup"
          className="btn bg-white px-6 py-3 text-iris-700 shadow-soft hover:bg-iris-50"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}