import { ProgressRing } from "@/components/progress-ring";
import type { CalendarDay } from "@/lib/calendar";
import { habitTallies, ratePercent, tally, type RateOccurrence } from "@/lib/completion-rate";
import { iconEmoji } from "@/lib/habit-icons";
import { shortDate } from "@/lib/mood-history";

/**
 * How much of each week and each habit got done in the month shown (#24).
 * Repeating habits only, up to today; `occurrences` covers the whole grid.
 */
export function CompletionRings({
  month,
  weeks,
  today,
  occurrences,
}: {
  month: string; // "2026-10"
  weeks: CalendarDay[][];
  today: string;
  occurrences: RateOccurrence[];
}) {
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`; // dates compare as text, so this covers every month
  if (monthStart > today) {
    return <p className="mt-6 text-center text-sm text-caption">Nothing to count yet.</p>;
  }

  const monthTally = tally(occurrences, monthStart, monthEnd);
  const monthPercent = ratePercent(monthTally);
  if (monthPercent === null) {
    return <p className="mt-6 text-center text-sm text-caption">No habits scheduled this month.</p>;
  }
  const habits = habitTallies(occurrences.filter((o) => o.date >= monthStart && o.date <= monthEnd));

  return (
    <section aria-label="Habits done" className="mt-6 space-y-5">
      <div className="flex items-center gap-4">
        <ProgressRing percent={monthPercent} size={96} stroke={12}>
          <span className="text-xl font-black">{monthPercent}%</span>
        </ProgressRing>
        <div>
          <h3 className="text-lg">Habits done this month</h3>
          <p className="text-sm text-caption">
            {monthTally.done} of {monthTally.scheduled}
            {month === today.slice(0, 7) ? " so far" : ""}
          </p>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-base">By week</h3>
        <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {weeks.map((week) => {
            const start = week[0].date;
            const t = tally(occurrences, start, week[6].date);
            const percent = start > today ? null : ratePercent(t);
            return (
              <li
                key={start}
                className="flex flex-col items-center gap-1"
                data-hint={percent === null ? "Nothing scheduled" : `${t.done} of ${t.scheduled} done`}
              >
                <ProgressRing percent={percent} size={52} stroke={7}>
                  <span className="text-xs font-bold">{percent === null ? "–" : `${percent}%`}</span>
                </ProgressRing>
                <span className="text-xs whitespace-nowrap text-caption">{shortDate(start)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-base">By habit</h3>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-3">
          {habits.map(({ name, icon, tally: t }) => {
            const percent = ratePercent(t);
            return (
              <li
                key={name}
                className="flex min-w-0 flex-col items-center gap-1"
                data-hint={`${name} · ${t.done} of ${t.scheduled}`}
              >
                <ProgressRing percent={percent} size={64} stroke={8}>
                  {/* No icon: the name's first letter instead. */}
                  <span aria-hidden className="text-2xl font-black text-caption">
                    {iconEmoji(icon) ?? name.charAt(0).toUpperCase()}
                  </span>
                </ProgressRing>
                <span className="w-full truncate text-center text-xs font-bold">{name}</span>
                <span className="text-xs text-caption">{percent}%</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
