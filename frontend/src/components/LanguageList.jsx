import { formatPercent } from '../utils/format.js';

/**
 * Ranked language breakdown (GitHub returns exact byte counts per language).
 */
export default function LanguageList({ languages = [], limit = 6, showBar = true }) {
  if (!languages?.length) {
    return (
      <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-4 text-xs text-ink-soft/65">
        GitHub did not return language data for this repository. That happens with empty, very new or
        binary-only projects.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5">
      {languages.slice(0, limit).map((lang, index) => (
        <li
          key={`${lang.language}-${index}`}
          className="group animate-rise"
          style={{ animationDelay: `${index * 60}ms` }}
        >
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-ink">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full transition-transform duration-200 group-hover:scale-125"
                style={{ backgroundColor: lang.color }}
              />
              <span className="truncate">{lang.language}</span>
            </span>
            <span className="font-mono text-ink-soft/70">
              {formatPercent(lang.percentage, lang.percentage < 10 ? 1 : 0)}
            </span>
          </div>
          {showBar && (
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-iris-50">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(lang.percentage, 1.5)}%`,
                  background: `linear-gradient(90deg, ${lang.color}, ${lang.color}99)`,
                }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}