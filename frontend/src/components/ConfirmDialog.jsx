import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

/** Small modal used before destructive actions (delete repository). */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === 'Escape') onCancel?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-ink/35 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md animate-rise rounded-3xl border border-white/70 bg-white/95 p-6 shadow-lift backdrop-blur-xl"
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-coral-50 text-coral-500">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h3 className="mt-4 font-display text-xl font-bold text-ink">{title}</h3>
        {message && <p className="mt-2 text-sm leading-relaxed text-ink-soft/75">{message}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn bg-coral-500 text-white shadow-soft hover:bg-coral-600"
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}