/**
 * GitHub-style contribution grid built from the daily commit series.
 * Each cell = one day, colour intensity = commits that day (real data).
 */
const LEVELS = ['#EDEAFB', '#C6BEF9', '#9C90F5', '#6C5CE7', '#3D2F94'];

export default function ContributionGrid({ data = [], weeks = 12 }) {
  if (!data.length) return null;

  const cells = [...data];
  const columns = [];

  // Pad the start so the grid always begins on a Monday.
  const firstDate = new Date(cells[0].date);
  const offset = (firstDate.getDay() + 6) % 7;
  for (let i = 0; i < offset; i += 1) cells.unshift(null);

  for (let i = 0; i < cells.length; i += 7) {
    columns.push(cells.slice(i, i + 7));
  }

  const max = Math.max(1, ...data.map((d) => d.commits));

  const colorFor = (commits) => {
    if (commits === 0) return LEVELS[0];
    const ratio = commits / max;
    if (ratio <= 0.25) return LEVELS[1];
    if (ratio <= 0.5) return LEVELS[2];
    if (ratio <= 0.75) return LEVELS[3];
    return LEVELS[4];
  };

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', ''];

  return (
    <div className="w-full">
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px] pt-[1px]">
          {dayLabels.map((label, i) => (
            <span
              key={i}
              className="flex h-[14px] w-6 items-center text-[9px] font-semibold text-ink-soft/45"
            >
              {label}
            </span>
          ))}
        </div>

        <div className="no-scrollbar flex gap-[3px] overflow-x-auto pb-1">
          {columns.slice(-weeks).map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, di) => (
                <span
                  key={`${wi}-${di}`}
                  title={cell ? `${cell.date} — ${cell.commits} commit${cell.commits === 1 ? '' : 's'}` : ''}
                  className="h-[14px] w-[14px] shrink-0 rounded-[4px] transition-transform duration-200 hover:scale-125"
                  style={{
                    backgroundColor: cell ? colorFor(cell.commits) : 'transparent',
                    border: cell ? 'none' : '1px dashed #E4E2FD',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-ink-soft/55">
        Less
        {LEVELS.map((color) => (
          <span key={color} className="h-[11px] w-[11px] rounded-[3px]" style={{ backgroundColor: color }} />
        ))}
        More
      </div>
    </div>
  );
}