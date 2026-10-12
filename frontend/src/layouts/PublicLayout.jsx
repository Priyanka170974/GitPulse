import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Compass, House, Menu, X, LogOut, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { NAV_LINKS, SCORE_DISCLAIMER } from '../utils/constants.js';
import { NAV_ICONS } from '../utils/icons.js';
import { initials } from '../utils/format.js';

const NAV = [
  { to: '/', label: 'Home', icon: House },
  { to: '/about', label: 'About', icon: Compass },
];

export default function PublicLayout() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? 'border-b border-iris-100/70 bg-white/80 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Logo />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-iris-50 text-iris-700 shadow-inner'
                        : 'text-ink-soft hover:bg-iris-50/70 hover:text-iris-700'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary">
                <Sparkles className="h-4 w-4" /> Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Log in
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-xl border border-iris-100 bg-white/80 text-ink md:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-iris-100 bg-white/95 px-5 py-4 backdrop-blur-xl md:hidden animate-fade-in">
            <nav className="space-y-1">
              {NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-soft hover:bg-iris-50"
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 flex gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary flex-1">
                  Open dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary flex-1">
                    Log in
                  </Link>
                  <Link to="/signup" className="btn-primary flex-1">
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

      <div className="border-t border-iris-100/60 bg-white/60 px-5 py-3 text-center text-[11px] text-ink-soft/55">
        {SCORE_DISCLAIMER}
      </div>
    </div>
  );
}

/** Sidebar navigation definition reused by the dashboard layout. */
export function dashboardNavItems(isAdmin) {
  const items = [...NAV_LINKS];
  if (isAdmin) {
    items.splice(items.length - 1, 0, { to: '/admin', label: 'Admin', icon: 'ShieldCheck' });
  }
  return items;
}

export function UserChip({ user, onLogout }) {
  return (
    <div className="rounded-2xl border border-iris-100 bg-white/80 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-iris-aqua font-display text-sm font-bold text-white">
          {initials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{user?.name}</p>
          <p className="truncate text-[11px] text-ink-soft/65">{user?.email}</p>
        </div>
        {user?.role === 'admin' && (
          <span className="chip bg-coral-50 text-coral-600" title="Administrator account">
            <ShieldCheck className="h-3 w-3" />
          </span>
        )}
      </div>
      <button type="button" onClick={onLogout} className="btn-ghost btn-sm mt-3 w-full text-coral-600">
        <LogOut className="h-3.5 w-3.5" /> Log out
      </button>
    </div>
  );
}