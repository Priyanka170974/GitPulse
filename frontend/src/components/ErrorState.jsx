import { AlertTriangle, RotateCcw } from 'lucide-react';

/** Friendly error panel — never shows a stack trace. */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'We could not complete that request. Please try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`animate-rise rounded-3xl border border-coral-200 bg-coral-50/70 p-6 text-center shadow-soft ${className}`}
    >
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-coral-500 shadow-sm">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-ink-soft/75">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-5">
          <RotateCcw className="h-4 w-4" /> Try again
        </button>
      )}
    </div>
  );
}