import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatNumber } from '../utils/format.js';

const BAR_COLORS = ['#CDC7FB', '#B5ACF8', '#9C90F5', '#8474F2', '#6C5CE7'];

/**
 * Day-wise clone activity for the 14-day window GitHub reports.
 * Bar colour deepens towards the most recent days, matching the existing
 * weekly commit chart so both charts read as one system.
 */
export default function CloneActivityChart({ daily = [] }) {
  return (
    <ChartCard
      icon={Download}
      title="Clones per day"
      description="Last 14 days · aggregate counts from the GitHub repository traffic API."
      info="GitHub returns aggregate clone counts for the last 14 days. It never exposes which accounts cloned a repository, so GitPulse reports totals only."
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={daily} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={46} />
            <Tooltip
              cursor={{ fill: 'rgba(108,92,231,0.06)' }}
              content={
                <CustomTooltip
                  labelFormatter={(label) => `Day: ${label}`}
                  valueFormatter={(value) => formatNumber(value)}
                />
              }
            />
            <Bar dataKey="count" name="Clones" radius={[8, 8, 4, 4]} animationDuration={900} maxBarSize={26}>
              {daily.map((entry, index) => (
                <Cell
                  key={`${entry.date}-${index}`}
                  fill={BAR_COLORS[Math.min(BAR_COLORS.length - 1, Math.floor((index / Math.max(daily.length, 1)) * BAR_COLORS.length))]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}