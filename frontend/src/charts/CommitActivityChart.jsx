import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';

/** Daily commit waveform — the signature "pulse" chart. */
export default function CommitActivityChart({ data = [], title = 'Commit Activity (last 14 days)' }) {
  const hasCommits = data.some((d) => d.commits > 0);

  return (
    <ChartCard
      icon={LineIcon}
      title={title}
      description="Commits per day, counted from real commit timestamps fetched from GitHub."
      info="Every day of the window is included, even the days with zero commits — GitPulse never hides quiet periods."
      action={
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-iris-500" />
          <span className="text-[11px] font-semibold text-ink-soft/70">commits / day</span>
        </div>
      }
    >
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="gp-commit-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.42} />
                <stop offset="60%" stopColor="#2FC9E8" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#2FC9E8" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={38} />
            <Tooltip
              cursor={{ stroke: '#8B7DF3', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={<CustomTooltip labelFormatter={(label) => `Day: ${label}`} />}
            />
            <Area
              type="monotone"
              dataKey="commits"
              name="Commits"
              stroke="#6C5CE7"
              strokeWidth={2.5}
              fill="url(#gp-commit-fill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1100}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {!hasCommits && (
        <p className="mt-3 rounded-xl bg-amber-100/60 px-3 py-2 text-center text-xs text-amber-500">
          No commits were pushed in this window — the repository may be archived or inactive.
        </p>
      )}
    </ChartCard>
  );
}