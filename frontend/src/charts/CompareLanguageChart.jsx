import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Languages } from 'lucide-react';
import ChartCard from './ChartCard.jsx';
import CustomTooltip from './CustomTooltip.jsx';
import { formatPercent } from '../utils/format.js';

/** Side-by-side language byte comparison for two repositories. */
export default function CompareLanguageChart({ languagesA = [], languagesB = [], nameA, nameB }) {
  const names = [...new Set([...languagesA, ...languagesB].map((l) => l.language))].slice(0, 8);

  const data = names.map((language) => {
    const a = languagesA.find((l) => l.language === language);
    const b = languagesB.find((l) => l.language === language);
    return {
      language,
      short: language.length > 9 ? `${language.slice(0, 8)}…` : language,
      a: a?.percentage ?? 0,
      b: b?.percentage ?? 0,
      colorA: a?.color || '#6C5CE7',
      colorB: b?.color || '#12A9CC',
    };
  });

  if (data.length === 0) {
    return (
      <ChartCard icon={Languages} title="Language comparison">
        <p className="rounded-2xl border border-dashed border-iris-200 bg-iris-50/40 p-6 text-center text-xs text-ink-soft/65">
          Neither repository returned language data.
        </p>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      icon={Languages}
      title="Language comparison"
      description="Percentage of measured code base per language."
      info="Percentages come from GitHub's byte counts. Languages only used by one repository show 0% for the other side."
    >
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDEAFB" vertical={false} />
            <XAxis dataKey="short" tickLine={false} axisLine={false} tickMargin={10} interval={0} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={54}
              tickFormatter={(v) => `${Math.round(v)}%`}
            />
            <Tooltip
              cursor={{ fill: 'rgba(108,92,231,0.06)' }}
              content={
                <CustomTooltip
                  hideLabel
                  valueFormatter={(value, entry) =>
                    `${formatPercent(value, 1)} · ${entry.dataKey === 'a' ? nameA : nameB}`
                  }
                />
              }
            />
            <Bar dataKey="a" name={nameA} radius={[6, 6, 2, 2]} animationDuration={900} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={`a-${entry.language}`} fill={entry.colorA} />
              ))}
            </Bar>
            <Bar dataKey="b" name={nameB} radius={[6, 6, 2, 2]} animationDuration={900} maxBarSize={22}>
              {data.map((entry) => (
                <Cell key={`b-${entry.language}`} fill={entry.colorB} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}