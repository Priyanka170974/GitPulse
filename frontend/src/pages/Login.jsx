import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, LogIn, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { login, sessionMessage } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (sessionMessage) toast.warning(sessionMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionMessage]);

  function update(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
    };
  }

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (error) {
      setErrors({ form: error.message });
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft/70">
        New to GitPulse?{' '}
        <Link to="/signup" className="font-semibold text-iris-600 link-underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
        {errors.form && (
          <div className="flex items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-600 animate-fade-in">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <div>
          <label htmlFor="email" className="field-label">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              className={`field pl-11 ${errors.email ? 'border-coral-400' : ''}`}
            />
          </div>
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={form.password}
              onChange={update('password')}
              placeholder="••••••••"
              className={`field pl-11 pr-11 ${errors.password ? 'border-coral-400' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink-soft/40 transition hover:bg-iris-50 hover:text-iris-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" /> Sign in
            </>
          )}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-iris-100 bg-iris-50/60 p-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-iris-600">
          <UserRound className="h-3.5 w-3.5" /> Demo accounts
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-soft/70">
          Signup creates a normal <span className="font-mono">user</span> account automatically. To create
          an administrator, run{' '}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-iris-700">
            npm run seed:admin
          </code>{' '}
          in the <span className="font-mono">backend</span> folder — no credentials are hard-coded.
        </p>
      </div>

      <Link to="/" className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft/70 hover:text-iris-600">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to the landing page
      </Link>
    </div>
  );
}