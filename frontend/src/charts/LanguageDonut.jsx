import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import LanguageList from '../components/LanguageList.jsx';
import { formatPercent } from '../utils/format.js';

/** Language distribution donut + ranked list (real GitHub byte data). */
export default function LanguageDonut({ languages = [], title = 'Language Distribution' }) {
  const data = (languages || []).slice(0, 7);
  const total = data.reduce((sum, l) => sum + l.percentage, 0);

  return (
    <ChartCard
      title={title}
      description="Byte counts returned by the GitHub languages endpoint."
      info="GitHub reports the size in bytes for every language it detects. GitPulse converts those bytes into percentages for this donut."
    >
      <div className="grid items-center gap-4 sm:grid-cols-[180px_1fr]">
        <div className="relative h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="percentage"
                nameKey="language"
                innerRadius={54}
                outerRadius={82}
                paddingAngle={2}
                stroke="none"
                animationDuration={900}
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry.language}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={
                  <CustomTooltip
                    hideLabel
                    valueFormatter={(value, entry) =>
                      `${formatPercent(value, 1)} · ${entry.payload.language}`
                    }
                  />
                }
              />
            </PieChart>
          </ResponsiveContainer>

          {data.length > 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-display text-xl font-extrabold text-ink">{data.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft/60">
                  {data.length === 1 ? 'language' : 'languages'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <LanguageList languages={languages} limit={6} />
          {data.length > 0 && (
            <p className="mt-3 text-[11px] text-ink-soft/60">
              Top {data.length} languages cover {formatPercent(Math.min(total, 100), 0)} of the measured
              code base.
            </p>
          )}
        </div>
      </div>
    </ChartCard>
  );
}