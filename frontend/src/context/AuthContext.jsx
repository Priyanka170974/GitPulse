import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, UNAUTHORIZED_EVENT } from '../services/api.js';
import tokenStorage from '../services/tokenStorage.js';

const AuthContext = createContext(null);

/**
 * Holds the JWT + current user for the whole app.
 * On mount it verifies the stored token against GET /api/auth/me so a
 * tampered or expired token can never open a protected screen.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [token, setToken] = useState(() => tokenStorage.get());
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const [sessionMessage, setSessionMessage] = useState('');

  const signOut = useCallback((message = '') => {
    tokenStorage.clear();
    setUser(null);
    setToken(null);
    setStatus('anonymous');
    setSessionMessage(message);
  }, []);

  /* Verify the persisted token on first render. */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = tokenStorage.get();
      if (!stored) {
        setStatus('anonymous');
        return;
      }
      try {
        const data = await authApi.me();
        if (cancelled) return;
        setUser(data.user);
        tokenStorage.setUser(data.user);
        setToken(stored);
        setStatus('authenticated');
      } catch {
        if (cancelled) return;
        tokenStorage.clear();
        setUser(null);
        setToken(null);
        setStatus('anonymous');
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  /* The API layer fires this event when the server rejects our token. */
  useEffect(() => {
    const handler = (event) => {
      const message = event?.detail?.message || 'Your session has ended. Please sign in again.';
      signOut(message);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [signOut]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    tokenStorage.set(data.token);
    tokenStorage.setUser(data.user);
    setToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    setSessionMessage('');
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await authApi.register(payload);
    tokenStorage.set(data.token);
    tokenStorage.setUser(data.user);
    setToken(data.token);
    setUser(data.user);
    setStatus('authenticated');
    setSessionMessage('');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* the JWT is stateless — a failed network call must still clear the session */
    }
    signOut('');
  }, [signOut]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me();
      setUser(data.user);
      tokenStorage.setUser(data.user);
      return data;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      status,
      isAuthenticated: status === 'authenticated',
      isAdmin: user?.role === 'admin',
      sessionMessage,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, token, status, sessionMessage, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;