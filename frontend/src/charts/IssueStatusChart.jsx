import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Bug } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatNumber } from '../utils/format.js';

/** Open vs closed issues + top issue labels. */
export default function IssueStatusChart({ open = 0, closed = 0, labels = [] }) {
  const statusData = [
    { name: 'Open', value: open, color: '#FF6F8F' },
    { name: 'Closed', value: closed, color: '#34D399' },
  ].filter((d) => d.value > 0);

  const total = open + closed;
  const resolved = total > 0 ? Math.round((closed / total) * 100) : 0;

  return (
    <ChartCard
      icon={Bug}
      title="Issue Status"
      description="Pull requests are excluded from these numbers."
      info="GitHub's issues endpoint also returns pull requests, so GitPulse filters them out and reports open/closed issues separately from pull requests."
    >
      {total === 0 ? (
        <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
          GitHub returned no issues for this repository.
        </p>
      ) : (
        <>
          <div className="h-[168px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} width={38} />
                <Tooltip
                  cursor={{ fill: 'rgba(108,92,231,0.06)' }}
                  content={<CustomTooltip hideLabel valueFormatter={(value) => `${formatNumber(value)} issues`} />}
                />
                <Bar dataKey="value" name="Issues" radius={[10, 10, 4, 4]} animationDuration={900} maxBarSize={72}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-mint-100/70 to-aqua-50 px-4 py-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint-400 to-aqua-400 transition-all duration-700"
                style={{ width: `${resolved}%` }}
              />
            </div>
            <span className="shrink-0 font-mono text-xs font-bold text-ink-soft">{resolved}% resolved</span>
          </div>

          {labels.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-soft/55">
                Most common labels
              </p>
              <div className="flex flex-wrap gap-1.5">
                {labels.slice(0, 5).map((label, index) => (
                  <span
                    key={`${label.name}-${index}`}
                    className="chip border border-iris-100 bg-white text-ink-soft shadow-sm"
                  >
                    {label.name}
                    <span className="font-mono text-iris-600">{label.value}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ChartCard>
  );
}