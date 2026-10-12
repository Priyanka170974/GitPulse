import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import Logo from '../components/Logo.jsx';

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 grid-mesh opacity-60" />
      <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-iris-300/25 blur-3xl animate-drift" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-aqua-300/25 blur-3xl animate-drift" />

      <div className="relative w-full max-w-lg text-center">
        <Logo to="/" className="justify-center" />

        <p className="mt-10 font-display text-[86px] font-extrabold leading-none text-gradient sm:text-[120px]">
          404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink">This page has no pulse.</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft/70">
          The URL you followed does not match any route in the GitPulse app. It may have been moved, or the
          link may be incomplete.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">
            <Compass className="h-4 w-4" /> Back to home
          </Link>
          <Link to="/dashboard" className="btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}