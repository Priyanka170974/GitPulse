/** Skeleton primitives — used while the dashboard data is loading. */
export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="w-full">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton mt-2 h-3 w-full" />
          <div className="skeleton mt-1.5 h-3 w-4/5" />
        </div>
        <div className="skeleton ml-4 h-11 w-11 rounded-2xl" />
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-12" />
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <div className="skeleton h-8 flex-1" />
        <div className="skeleton h-8 w-24" />
      </div>
    </div>
  );
}

export function SkeletonStats({ count = 5 }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton mt-3 h-8 w-16" />
          <div className="mt-4 flex items-center gap-2">
            <div className="skeleton h-5 w-12 rounded-full" />
            <div className="skeleton h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 280, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="skeleton h-4 w-40" />
      <div className="skeleton mt-2 h-3 w-64" />
      <div className="skeleton mt-6" style={{ height }} />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <SkeletonStats count={5} />
      <div className="grid gap-5 lg:grid-cols-3">
        <SkeletonChart className="lg:col-span-2" />
        <SkeletonChart height={220} />
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

/** Inline spinner used by buttons and small panels. */
export function Spinner({ className = 'h-5 w-5' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Full-panel loader. */
export function LoadingPanel({ message = 'Loading…', submessage }) {
  return (
    <div className="card grid place-items-center px-6 py-20 text-center animate-fade-in">
      <span className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-iris-200" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-iris-600" />
        <span className="h-2 w-2 rounded-full bg-coral-400" />
      </span>
      <p className="mt-5 text-sm font-semibold text-ink">{message}</p>
      {submessage && <p className="mt-1 text-xs text-ink-soft/65">{submessage}</p>}
    </div>
  );
}

export default SkeletonPage;