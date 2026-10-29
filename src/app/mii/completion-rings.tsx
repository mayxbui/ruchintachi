import { ProgressRing } from "@/components/progress-ring";
import { habitTallies, ratePercent, tally, type RateOccurrence } from "@/lib/completion-rate";
import { iconEmoji } from "@/lib/habit-icons";

/**
 * This month so far (#24): one ring with how many tasks got done (habits
 * and one-off tasks alike), filled by done ÷ scheduled, then a ring per
 * repeating habit. `occurrences` runs from the first of the month to today.
 */
export function CompletionRings({ occurrences }: { occurrences: RateOccurrence[] }) {
  const all = tally(occurrences);
  if (all.scheduled === 0) {
    return <p className="mt-6 text-center text-sm text-caption">Nothing scheduled this month yet.</p>;
  }
  const habits = habitTallies(occurrences.filter((o) => o.repeats));

  return (
    <section aria-label="This month" className="mt-6 space-y-5">
      <div className="flex items-center gap-4" data-hint={`${all.done} of ${all.scheduled} done`}>
        <ProgressRing percent={ratePercent(all)} size={96} stroke={12}>
          <span className="text-3xl font-black">{all.done}</span>
        </ProgressRing>
        <h2 className="text-xl">
          {all.done === 1 ? "task" : "tasks"} done
          <br />
          this month
        </h2>
      </div>

      {habits.length > 0 && (
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
      )}
    </section>
  );
}
