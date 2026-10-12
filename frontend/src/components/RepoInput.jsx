import { useState } from 'react';
import { AlertCircle, Link2, Loader2, Search, X } from 'lucide-react';

const SAMPLE_URLS = [
  'https://github.com/facebook/react',
  'https://github.com/vitejs/vite',
  'https://github.com/Priyanka170974/Code-Master-Quiz',
];

/**
 * "Paste GitHub repository URL" input used on the Dashboard.
 * Accepts full URLs and the short owner/repo form.
 */
export default function RepoInput({ onAnalyze, loading, input, onInputChange }) {
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const value = input.trim();
    if (!value) {
      setError('Paste a repository URL to analyze.');
      return;
    }
    setError('');
    onAnalyze(value);
  }

  function handleClear() {
    onInputChange('');
    setError('');
  }

  return (
    <div className="card animate-rise overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ink">Analyze a repository</h2>
          <p className="text-xs text-ink-soft/70">
            Paste any public GitHub repository URL — GitPulse fetches live data from the GitHub REST API.
          </p>
        </div>
        <span className="chip border border-iris-100 bg-iris-50 text-iris-600">
          <Link2 className="h-3 w-3" /> owner / repository
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/40" />
          <input
            type="text"
            value={input}
            onChange={(e) => {
              onInputChange(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://github.com/owner/repository"
            aria-label="GitHub repository URL"
            autoComplete="off"
            spellCheck="false"
            className={`field pl-11 pr-10 ${error ? 'border-coral-400 ring-coral-100' : ''}`}
          />
          {input && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear input"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-soft/40 transition hover:bg-iris-50 hover:text-iris-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary flex-1 sm:flex-none">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Analyzing…' : 'Analyze Repository'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || !input}
            className="btn-secondary"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        </div>
      </form>

      {error && (
        <p className="field-error">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-iris-100 bg-iris-50/60 px-4 py-3 animate-fade-in">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-iris-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-iris-600" />
          </span>
          <p className="text-sm font-medium text-iris-700">
            Analyzing repository<span className="loading-dots" />
          </p>
          <p className="ml-auto hidden text-xs text-ink-soft/60 sm:block">
            Calling GitHub API → computing analytics → saving to MongoDB
          </p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-soft/60">
        <span className="font-semibold">Try:</span>
        {SAMPLE_URLS.map((url) => (
          <button
            key={url}
            type="button"
            disabled={loading}
            onClick={() => onInputChange(url)}
            className="rounded-full border border-iris-100 bg-white/70 px-2.5 py-1 font-mono text-[11px] transition hover:border-iris-300 hover:text-iris-600 disabled:opacity-50"
          >
            {url.replace('https://github.com/', '')}
          </button>
        ))}
      </div>
    </div>
  );
}