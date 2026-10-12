import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Spinner } from './Loading.jsx';
import Logo from './Logo.jsx';

/** Gate for every private screen. Also handles the admin-only route. */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-5">
          <Logo to="/" />
          <div className="flex items-center gap-3 text-sm text-ink-soft">
            <Spinner />
            Restoring your session…
          </div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return (
      <div className="card mx-auto mt-10 max-w-xl p-8 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Administrator access required</h2>
        <p className="mt-2 text-sm text-ink-soft/70">
          Your account does not have the <span className="font-mono">admin</span> role, so this area is
          closed. Create an admin with{' '}
          <code className="rounded bg-iris-50 px-1.5 py-0.5 font-mono text-xs text-iris-700">
            npm run seed:admin
          </code>
          in the backend folder.
        </p>
        <a href="/dashboard" className="btn-primary mt-6">
          Back to dashboard
        </a>
      </div>
    );
  }

  return children;
}

/** Keeps signed-in users out of the login / signup screens. */
export function PublicOnlyRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner className="h-8 w-8 text-iris-600" />
      </div>
    );
  }

  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return children;
}