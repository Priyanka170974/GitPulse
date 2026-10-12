import { Activity } from 'lucide-react';
import { levelTheme } from '../utils/format.js';

/** High / Moderate / Low pill — always labelled as a GitPulse indicator. */
export default function ActivityBadge({ level = 'unknown', score, size = 'md', showIcon = true }) {
  const theme = levelTheme(level);
  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`chip ${sizes[size]} ${theme.bg} ${theme.text} ${theme.border} border`}
      title="GitPulse-defined activity indicator, calculated from real GitHub data."
    >
      {showIcon && <Activity className="h-3 w-3" />}
      {theme.label}
      {score !== undefined && <span className="font-mono opacity-70">{Math.round(score)}</span>}
    </span>
  );
}