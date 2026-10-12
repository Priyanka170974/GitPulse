import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  AtSign,
  CalendarDays,
  FolderGit2,
  LogOut,
  Pencil,
  Save,
  ShieldCheck,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { SkeletonCard, SkeletonStats } from '../components/Loading.jsx';
import { authApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatDate, formatNumber, formatRelative, initials } from '../utils/format.js';
import { SCORE_DISCLAIMER } from '../utils/constants.js';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.me();
      setProfile(data);
      setName(data.user.name);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    if (name.trim().length < 2) {
      toast.error('Your name must be at least 2 characters long.');
      return;
    }
    setSaving(true);
    try {
      const data = await authApi.updateProfile({ name: name.trim() });
      setProfile((prev) => ({ ...prev, user: data.user }));
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonStats count={4} />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={load} />;

  const currentUser = profile?.user || user;
  const stats = profile?.stats || {};

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Account"
        title="Profile"
        description="Your GitPulse identity, account details and analysis activity."
      />

      {/* --------------------------- identity ------------------------- */}
      <section className="card relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-iris-300/30 blur-3xl animate-drift" />

        <div className="relative flex flex-wrap items-center gap-6">
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-3xl bg-iris-aqua font-display text-3xl font-extrabold text-white shadow-lift">
            {initials(currentUser?.name)}
          </span>

          <div className="min-w-0 flex-1">
            {editing ? (
              <form onSubmit={handleSave} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1">
                  <label htmlFor="profile-name" className="field-label">
                    Display name
                  </label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field"
                    maxLength={60}
                  />
                </div>
                <button type="submit" disabled={saving} className="btn-primary">
                  <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setName(currentUser.name);
                  }}
                  className="btn-ghost"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-2xl font-extrabold text-ink">{currentUser?.name}</h2>
                  <span
                    className={`chip ${
                      currentUser?.role === 'admin'
                        ? 'bg-coral-50 text-coral-600'
                        : 'bg-iris-50 text-iris-600'
                    }`}
                  >
                    {currentUser?.role === 'admin' ? <ShieldCheck className="h-3 w-3" /> : <AtSign className="h-3 w-3" />}
                    {currentUser?.role}
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-soft/70">{currentUser?.email}</p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="btn-secondary btn-sm mt-4"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit display name
                </button>
              </>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button type="button" onClick={handleLogout} className="btn-secondary">
              <LogOut className="h-4 w-4" /> Log out
            </button>
            {currentUser?.role === 'admin' && (
              <Link to="/admin" className="btn-primary">
                <ShieldCheck className="h-4 w-4" /> Admin console
              </Link>
            )}
          </div>
        </div>

        <p className="relative mt-6 flex items-start gap-2 rounded-2xl bg-iris-50/70 px-4 py-3 text-[11px] leading-relaxed text-ink-soft/70">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-iris-500" />
          Your role is fixed at signup (<span className="font-mono">user</span>) and can only be changed by an
          administrator, so you can never promote yourself from the browser. Passwords are hashed with bcrypt
          and the JWT secret never leaves the server.
        </p>
      </section>

      {/* ---------------------------- stats --------------------------- */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Repositories analyzed', value: stats.repositories ?? 0, icon: FolderGit2, tone: 'from-iris-500 to-iris-400' },
          { label: 'Total analyses', value: stats.analyses ?? 0, icon: Activity, tone: 'from-aqua-400 to-aqua-500' },
          { label: 'Average GitPulse score', value: stats.averagePulse ?? 0, icon: TrendingUp, tone: 'from-coral-400 to-coral-500' },
          { label: 'Member since', value: formatDate(stats.memberSince || currentUser?.createdAt), icon: CalendarDays, tone: 'from-mint-400 to-mint-500' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="card card-hover animate-rise p-5"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft/65">{stat.label}</p>
                <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${stat.tone} text-white`}>
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 font-display text-2xl font-extrabold text-ink">
                {typeof stat.value === 'number' ? formatNumber(stat.value) : stat.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* --------------------------- recent --------------------------- */}
      <section>
        <SectionHeading
          eyebrow="Activity"
          title="Recently analyzed"
          description="Your latest repositories and their GitPulse scores."
          action={
            <Link to="/repositories" className="btn-secondary btn-sm">
              Open library
            </Link>
          }
        />

        {profile?.recent?.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {profile.recent.map((repo, index) => (
              <Link
                key={repo.fullName}
                to="/repositories"
                className="card card-hover animate-rise flex items-center gap-3 p-4"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-500">
                  <Star className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{repo.fullName}</p>
                  <p className="text-[11px] text-ink-soft/60">{formatNumber(repo.stars)} stars</p>
                </div>
                <span className="chip shrink-0 bg-iris-50 font-mono text-iris-600">
                  pulse {repo.pulseScore}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-sm text-ink-soft/65">
            Nothing analyzed yet — head to the dashboard and paste a GitHub repository URL. Created{' '}
            {formatRelative(currentUser?.createdAt)}.
          </p>
        )}
      </section>

      <p className="text-center text-[11px] text-ink-soft/55">{SCORE_DISCLAIMER}</p>
    </div>
  );
}