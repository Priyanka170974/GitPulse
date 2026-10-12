import { Link } from 'react-router-dom';
import { Github, Heart, Sparkles } from 'lucide-react';
import Logo from './Logo.jsx';
import { APP_NAME } from '../utils/constants.js';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-iris-100/70 bg-white/50 backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft/70">
            {APP_NAME} turns public GitHub repository data into visual insights — commit rhythm,
            language mix, contributor spread, issue resolution and a project-defined pulse score.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-coral-50 px-3 py-1 text-[11px] font-medium text-coral-600">
            <Sparkles className="h-3 w-3" />
            Built as a MERN full-stack college project
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft/80">
            <li>
              <Link className="link-underline transition hover:text-iris-600" to="/about">
                About &amp; architecture
              </Link>
            </li>
            <li>
              <Link className="link-underline transition hover:text-iris-600" to="/login">
                Sign in
              </Link>
            </li>
            <li>
              <Link className="link-underline transition hover:text-iris-600" to="/signup">
                Create account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-ink">Data sources</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-soft/80">
            <li className="flex items-center gap-2">
              <Github className="h-4 w-4 text-ink-soft/50" /> GitHub REST API
            </li>
            <li>Node.js + Express</li>
            <li>MongoDB Atlas + Mongoose</li>
            <li>React + Recharts</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-iris-100/70 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-ink-soft/65 sm:flex-row">
          <p>
            © {year} {APP_NAME}. Analytics are project-defined and not official GitHub metrics.
          </p>
          <p className="inline-flex items-center gap-1.5">
            Made with <Heart className="h-3 w-3 text-coral-400" fill="currentColor" /> by a developer who
            wanted to see code pulse.
          </p>
        </div>
      </div>
    </footer>
  );
}