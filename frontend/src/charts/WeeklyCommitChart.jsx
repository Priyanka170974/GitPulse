import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3 } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';

const WEEK_COLORS = ['#CDC7FB', '#B5ACF8', '#9C90F5', '#8474F2', '#6C5CE7'];

/** 12-week commit histogram — the long view of the pulse. */
export default function WeeklyCommitChart({ data = [], title = 'Weekly Commit Trend' }) {
  return (
    <ChartCard
      icon={BarChart3}
      title={title}
      description="Commits grouped into calendar weeks (Monday start)."
      info="GitPulse groups the commit timestamps returned by GitHub into weeks. Older weeks fade lighter so the eye follows the most recent activity."
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={38} />
            <Tooltip
              cursor={{ fill: 'rgba(108,92,231,0.06)' }}
              content={<CustomTooltip labelFormatter={(label) => `Week of ${label}`} />}
            />
            <Bar dataKey="commits" name="Commits" radius={[8, 8, 4, 4]} animationDuration={900} maxBarSize={34}>
              {data.map((entry, index) => (
                <Cell
                  key={entry.week || index}
                  fill={WEEK_COLORS[Math.min(WEEK_COLORS.length - 1, Math.floor((index / Math.max(data.length, 1)) * WEEK_COLORS.length))]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}