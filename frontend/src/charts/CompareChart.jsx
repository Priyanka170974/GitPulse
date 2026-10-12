import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GitCompareArrows } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatNumber } from '../utils/format.js';

const COLORS = { a: '#6C5CE7', b: '#12A9CC' };

/** Grouped bars comparing two repositories across factual metrics. */
/** Short axis labels so seven metrics never overlap on a narrow card. */
const SHORT_LABELS = {
  stars: 'Stars',
  forks: 'Forks',
  watchers: 'Watchers',
  openIssues: 'Issues',
  contributors: 'Contributors',
  commits30Days: 'Commits 30d',
  pulseScore: 'Pulse',
};

export default function CompareChart({
  comparison = [],
  nameA = 'Repository A',
  nameB = 'Repository B',
}) {
  const data = comparison.map((row) => ({
    metric: SHORT_LABELS[row.key] || row.label,
    a: row.a,
    b: row.b,
  }));

  return (
    <ChartCard
      icon={GitCompareArrows}
      title="Metric comparison"
      description="Grouped bars — GitPulse only reports the numbers, never a winner."
      info="Both values are read from the GitHub API response stored at analysis time. GitPulse deliberately does not declare one repository better than another."
      action={
        <div className="flex items-center gap-3 text-[11px] font-semibold">
          <span className="inline-flex items-center gap-1.5 text-iris-600">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.a }} />
            {nameA}
          </span>
          <span className="inline-flex items-center gap-1.5 text-aqua-700">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS.b }} />
            {nameB}
          </span>
        </div>
      }
    >
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
            <XAxis dataKey="metric" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={54}
              tickFormatter={(value) => formatNumber(value)}
            />
            <Tooltip
              cursor={{ fill: 'rgba(108,92,231,0.06)' }}
              content={
                <CustomTooltip
                  hideLabel
                  valueFormatter={(value, entry) =>
                    `${formatNumber(value)} ${entry.dataKey === 'a' ? `· ${nameA}` : `· ${nameB}`}`
                  }
                />
              }
            />
            <Bar dataKey="a" name={nameA} fill={COLORS.a} radius={[8, 8, 3, 3]} animationDuration={900} maxBarSize={26} />
            <Bar dataKey="b" name={nameB} fill={COLORS.b} radius={[8, 8, 3, 3]} animationDuration={900} maxBarSize={26} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}