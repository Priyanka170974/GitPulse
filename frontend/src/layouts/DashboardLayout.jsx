import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, ShieldCheck, X } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { UserChip, dashboardNavItems } from './PublicLayout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { NAV_ICONS } from '../utils/icons.js';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/repositories': 'My Repositories',
  '/compare': 'Repository Compare',
  '/history': 'Analysis History',
  '/profile': 'Profile',
  '/about': 'About & Architecture',
  '/admin': 'Admin Console',
};

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const items = dashboardNavItems(isAdmin);

  const title =
    PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/repositories/') ? 'Repository Analytics' : 'GitPulse');

  async function handleLogout() {
    await logout();
    toast.success('Signed out. See you soon!');
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* ------------------------- sidebar ------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[270px] shrink-0 border-r border-iris-100/70 bg-white/85 px-4 py-5 backdrop-blur-xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          drawerOpen ? 'translate-x-0 shadow-lift' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between">
          <Logo to="/dashboard" />
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-soft hover:bg-iris-50 lg:hidden"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-7 flex-1 space-y-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon] || NAV_ICONS.LayoutDashboard;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/dashboard'}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-iris-50 text-iris-700 shadow-inner'
                      : 'text-ink-soft hover:translate-x-0.5 hover:bg-iris-50/60 hover:text-iris-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 h-6 w-1 rounded-r-full bg-iris-aqua transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-6 space-y-3">
          <Link to="/dashboard" className="btn-primary w-full">
            <Search className="h-4 w-4" /> Analyze a repository
          </Link>
          <UserChip user={user} onLogout={handleLogout} />
        </div>
      </aside>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ------------------------- main --------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-iris-100/70 bg-white/80 px-4 py-3.5 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-iris-100 bg-white text-ink lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-ink sm:text-xl">
                {title}
              </h1>
              <p className="hidden text-xs text-ink-soft/60 sm:block">
                Signed in as <span className="font-semibold text-iris-600">{user?.email}</span>
              </p>
            </div>

            <span className="hidden items-center gap-2 rounded-full border border-iris-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-ink-soft sm:inline-flex">
              <Bell className="h-3.5 w-3.5 text-iris-500" />
              {isAdmin ? 'Administrator' : 'Member'}
            </span>

            {isAdmin && (
              <Link to="/admin" className="btn-secondary btn-sm hidden sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" /> Admin
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="btn-ghost btn-sm text-coral-600 sm:hidden"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>

        <footer className="border-t border-iris-100/60 px-5 py-4 text-center text-[11px] text-ink-soft/55 sm:px-8">
          GitPulse · project-defined analytics, not official GitHub metrics · data fetched live from
          the GitHub REST API
        </footer>
      </div>
    </div>
  );
}