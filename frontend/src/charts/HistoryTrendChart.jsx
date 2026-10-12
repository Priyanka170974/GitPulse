import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { History } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatNumber } from '../utils/format.js';

/**
 * How the repository's metrics moved across GitPulse analysis snapshots.
 * Requires at least 2 snapshots to be meaningful.
 */
export default function HistoryTrendChart({ trend = [], title = 'Snapshot trend' }) {
  const hasEnough = trend.length >= 2;

  return (
    <ChartCard
      icon={History}
      title={title}
      description="Every point is one stored GitPulse analysis snapshot."
      info="GitPulse writes a snapshot on the first analysis and on every re-analysis. The gap between two points is exactly the time between those two GitHub API calls."
    >
      {!hasEnough ? (
        <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
          At least two analyses are needed to draw a trend. Use <strong>Re-analyze</strong> on the
          analytics page to add another data point.
        </p>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="gp-trend-stars" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gp-trend-forks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#12A9CC" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="#12A9CC" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} />
              <YAxis tickLine={false} axisLine={false} tickMargin={6} width={44} tickFormatter={formatNumber} />
              <Tooltip
                cursor={{ stroke: '#8B7DF3', strokeDasharray: '4 4' }}
                content={
                  <CustomTooltip
                    valueFormatter={(value) => formatNumber(value)}
                    labelFormatter={(label) => `Analyzed ${label}`}
                  />
                }
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Area
                type="monotone"
                dataKey="stars"
                name="Stars"
                stroke="#6C5CE7"
                strokeWidth={2.5}
                fill="url(#gp-trend-stars)"
                dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="monotone"
                dataKey="forks"
                name="Forks"
                stroke="#12A9CC"
                strokeWidth={2.5}
                fill="url(#gp-trend-forks)"
                dot={{ r: 3, strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="pulseScore"
                name="Pulse score"
                stroke="#F4507A"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 2.5, fill: '#F4507A', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}