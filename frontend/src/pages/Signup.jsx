import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Mail, ShieldCheck, UserPlus, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const STRENGTH_LABELS = [
  { min: 0, label: 'Too short', tone: 'bg-coral-400', text: 'text-coral-600' },
  { min: 8, label: 'Weak', tone: 'bg-coral-400', text: 'text-coral-600' },
  { min: 10, label: 'Fair', tone: 'bg-amber-400', text: 'text-amber-500' },
  { min: 13, label: 'Good', tone: 'bg-aqua-400', text: 'text-aqua-700' },
  { min: 16, label: 'Strong', tone: 'bg-mint-400', text: 'text-mint-600' },
];

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const strength = STRENGTH_LABELS.reduce((acc, level) => (form.password.length >= level.min ? level : acc), STRENGTH_LABELS[0]);

  function update(field) {
    return (event) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
      setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
    };
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required.';
    else if (form.name.trim().length < 2) next.name = 'Name must be at least 2 characters.';

    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = 'Enter a valid email address.';

    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';

    if (form.confirm !== form.password) next.confirm = 'Passwords do not match.';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      toast.success(`Account created — welcome, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error.details?.field) setErrors({ [error.details.field]: error.message });
      else setErrors({ form: error.message });
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink-soft/70">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-iris-600 link-underline">
          Sign in instead
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
          <label htmlFor="name" className="field-label">
            Full name
          </label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={update('name')}
              placeholder="Your name"
              className={`field pl-11 ${errors.name ? 'border-coral-400' : ''}`}
            />
          </div>
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="signup-email" className="field-label">
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              id="signup-email"
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
          <label htmlFor="signup-password" className="field-label">
            Password
          </label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              placeholder="At least 8 characters"
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

          {form.password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-iris-50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${strength.tone}`}
                  style={{ width: `${Math.min(100, (form.password.length / 18) * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-bold ${strength.text}`}>{strength.label}</span>
            </div>
          )}

          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirm" className="field-label">
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={form.confirm}
            onChange={update('confirm')}
            placeholder="Repeat your password"
            className={`field ${errors.confirm ? 'border-coral-400' : ''}`}
          />
          {errors.confirm && <p className="field-error">{errors.confirm}</p>}
        </div>

        <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
          {submitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" /> Create account
            </>
          )}
        </button>
      </form>

      <p className="mt-6 flex items-start gap-2 text-[11px] leading-relaxed text-ink-soft/60">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-iris-500" />
        Your password is hashed with <span className="font-mono">bcrypt</span> before it is stored. GitPulse
        never keeps plain-text passwords and never exposes your JWT secret.
      </p>

      <Link to="/" className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft/70 hover:text-iris-600">
        <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Back to the landing page
      </Link>
    </div>
  );
}