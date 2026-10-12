import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { UsersRound } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatNumber } from '../utils/format.js';

const CELL_COLORS = ['#6C5CE7', '#12A9CC', '#F4507A', '#34D399', '#FBBF24', '#8B7DF3', '#2FC9E8', '#FF6F8F'];

/** Horizontal bars: who is actually pushing the project. */
export default function ContributorBarChart({ data = [], title = 'Contributor Activity' }) {
  return (
    <ChartCard
      icon={UsersRound}
      title={title}
      description="Commits per author inside the fetched commit window."
      info="Counted from the commit authors returned by the GitHub commits endpoint. Avatars and all-time contribution totals come from the contributors endpoint."
      action={
        <span className="chip bg-aqua-50 text-aqua-700">
          {data.length} author{data.length === 1 ? '' : 's'}
        </span>
      }
    >
      {data.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
          GitHub did not return contributor data for this repository.
        </p>
      ) : (
        <div style={{ height: Math.max(220, data.length * 34 + 40) }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tickMargin={6} />
              <YAxis
                type="category"
                dataKey="login"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(18,169,204,0.07)' }}
                content={
                  <CustomTooltip
                    hideLabel
                    valueFormatter={(value, entry) =>
                      `${formatNumber(value)} commits · ${entry.payload.share}%`
                    }
                  />
                }
              />
              <Bar dataKey="commits" name="Commits" radius={[0, 8, 8, 0]} animationDuration={900} maxBarSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`${entry.login}-${index}`} fill={CELL_COLORS[index % CELL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}