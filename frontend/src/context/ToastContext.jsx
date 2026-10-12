import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const TONE = {
  success: { icon: CheckCircle2, ring: 'border-mint-400/50', bg: 'from-mint-100/95 to-white', accent: 'text-mint-600', bar: 'bg-mint-400' },
  error: { icon: XCircle, ring: 'border-coral-300/60', bg: 'from-coral-50/95 to-white', accent: 'text-coral-600', bar: 'bg-coral-400' },
  info: { icon: Info, ring: 'border-aqua-200', bg: 'from-aqua-50/95 to-white', accent: 'text-aqua-700', bar: 'bg-aqua-400' },
  warning: { icon: AlertTriangle, ring: 'border-amber-400/60', bg: 'from-amber-100/90 to-white', accent: 'text-amber-500', bar: 'bg-amber-400' },
};

let nextId = 1;

/** Toast notifications used across the whole app. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, { tone = 'info', title, duration = 4200 } = {}) => {
      if (!message) return null;
      const id = nextId++;
      const toast = { id, message: String(message), tone, title };
      setToasts((current) => [...current.slice(-3), toast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      success: (message, options) => push(message, { ...options, tone: 'success' }),
      error: (message, options) => push(message, { ...options, tone: 'error', duration: 6000 }),
      info: (message, options) => push(message, { ...options, tone: 'info' }),
      warning: (message, options) => push(message, { ...options, tone: 'warning', duration: 5200 }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-3 p-4 sm:inset-x-auto sm:right-5 sm:top-5 sm:bottom-auto sm:items-end">
        {toasts.map((t) => {
          const tone = TONE[t.tone] || TONE.info;
          const Icon = tone.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto relative w-full max-w-sm animate-slide-in-right overflow-hidden rounded-2xl border ${tone.ring} bg-gradient-to-br ${tone.bg} p-4 shadow-lift backdrop-blur-xl`}
            >
              <div className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} />
              <div className="flex items-start gap-3 pl-1">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.accent}`} />
                <div className="min-w-0 flex-1">
                  {t.title ? (
                    <p className="text-sm font-bold text-ink">{t.title}</p>
                  ) : null}
                  <p className="text-sm leading-snug text-ink-soft">{t.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-ink-soft/50 transition hover:bg-white/70 hover:text-ink"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}

export default ToastContext;