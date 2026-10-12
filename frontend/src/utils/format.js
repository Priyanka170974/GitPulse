/* Formatting helpers shared by every page. */

export function formatNumber(value, { compact = true } = {}) {
  const n = Number(value) || 0;
  if (!compact) return n.toLocaleString('en-US');
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export function formatExact(value) {
  return (Number(value) || 0).toLocaleString('en-US');
}

export function formatPercent(value, digits = 0) {
  return `${(Number(value) || 0).toFixed(digits)}%`;
}

/** Safe parsing: returns a valid Date or null (never "Invalid Date"). */
export function toLocalDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toLocalDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Human readable date + time in the *viewer's* timezone, e.g.
 *   "Aug 14, 2026 · 6:40 PM"
 */
export function formatLocalDateTime(value) {
  const date = toLocalDate(value);
  if (!date) return null;

  const day = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);

  return `${day} · ${time}`;
}

/** e.g. "Asia/Kolkata (UTC+05:30)" — used as the secondary label / tooltip. */
export function formatTimeZoneLabel() {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMinutes);
    const hours = String(Math.floor(abs / 60)).padStart(2, '0');
    const minutes = String(abs % 60).padStart(2, '0');
    return `${timeZone || 'Local'} (UTC${sign}${hours}:${minutes})`;
  } catch {
    return 'Local timezone';
  }
}

/** Tooltip text: local time + timezone + the raw UTC value GitHub returned. */
export function formatFullTimestamp(value) {
  const date = toLocalDate(value);
  if (!date) return 'This value was not reported by GitHub';
  const local = formatLocalDateTime(date);
  const iso = date.toISOString();
  return `${local} — ${formatTimeZoneLabel()} · GitHub value: ${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelative(value) {
  if (!value) return 'never';
  const diff = Date.now() - new Date(value).getTime();
  const seconds = Math.round(diff / 1000);
  if (seconds < 45) return 'just now';

  const units = [
    { limit: 3600, value: 60, unit: 'minute' },
    { limit: 86400, value: 3600, unit: 'hour' },
    { limit: 2592000, value: 86400, unit: 'day' },
    { limit: 31536000, value: 2592000, unit: 'month' },
    { limit: Infinity, value: 31536000, unit: 'year' },
  ];

  const { value: divisor, unit } = units.find((u) => Math.abs(seconds) < u.limit);
  const amount = Math.round(seconds / divisor);
  if (amount <= 0) return 'just now';
  return `${amount} ${unit}${amount === 1 ? '' : 's'} ago`;
}

export function formatBytes(bytes) {
  const b = Number(bytes) || 0;
  if (b <= 0) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDelta(value, { suffix = '' } = {}) {
  const n = Number(value) || 0;
  if (n === 0) return 'no change';
  return `${n > 0 ? '+' : ''}${formatNumber(n)}${suffix}`;
}

export function deltaTone(value) {
  const n = Number(value) || 0;
  if (n > 0) return 'up';
  if (n < 0) return 'down';
  return 'flat';
}

export function initials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

export function truncate(text = '', length = 90) {
  const clean = String(text);
  return clean.length > length ? `${clean.slice(0, length - 1).trimEnd()}…` : clean;
}

/** High → Moderate → Low colour tokens (GitPulse palette). */
export function levelTheme(level) {
  switch (String(level).toLowerCase()) {
    case 'high':
      return {
        label: 'High',
        text: 'text-mint-600',
        bg: 'bg-mint-100',
        border: 'border-mint-400/40',
        dot: 'bg-mint-400',
        stroke: '#34D399',
        soft: 'from-mint-400/20 to-aqua-400/20',
      };
    case 'moderate':
      return {
        label: 'Moderate',
        text: 'text-amber-500',
        bg: 'bg-amber-100',
        border: 'border-amber-400/40',
        dot: 'bg-amber-400',
        stroke: '#FBBF24',
        soft: 'from-amber-400/20 to-coral-400/20',
      };
    case 'low':
      return {
        label: 'Low',
        text: 'text-coral-600',
        bg: 'bg-coral-50',
        border: 'border-coral-300/40',
        dot: 'bg-coral-400',
        stroke: '#FF6F8F',
        soft: 'from-coral-400/20 to-iris-400/20',
      };
    default:
      return {
        label: 'Unknown',
        text: 'text-ink-soft/70',
        bg: 'bg-iris-50',
        border: 'border-iris-200',
        dot: 'bg-ink-soft/40',
        stroke: '#ADA4F7',
        soft: 'from-iris-200/25 to-aqua-200/25',
      };
  }
}

export function toneTheme(tone) {
  switch (tone) {
    case 'positive':
      return 'border-mint-400/40 bg-mint-100/70 text-mint-600';
    case 'warning':
      return 'border-coral-300/50 bg-coral-50/80 text-coral-600';
    case 'neutral':
      return 'border-iris-100 bg-iris-50/70 text-iris-700';
    default:
      return 'border-aqua-200 bg-aqua-50 text-aqua-700';
  }
}

export function repoUrl(fullName) {
  return `https://github.com/${fullName}`;
}

export default {
  formatNumber,
  formatExact,
  formatPercent,
  formatDate,
  formatDateTime,
  formatRelative,
  formatBytes,
  formatDelta,
  deltaTone,
  initials,
  truncate,
  levelTheme,
  toneTheme,
  repoUrl,
};