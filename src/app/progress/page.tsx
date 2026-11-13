import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Link from "next/link";
import { ItemSprite } from "@/components/item-sprite";
import { MoodMeter, moods } from "@/components/mood-meter";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { listInventory } from "@/db/inventory";
import { currentMood, moodLogBetween } from "@/db/mood";
import { dayHistory } from "@/db/streak";
import { weeklyGiftsBetween } from "@/db/weekly-gifts";
import { requireUser } from "@/lib/auth/session";
import { addMonths, formatMonth, monthGrid, parseMonth, weekdayLabels } from "@/lib/calendar";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { groupInventory, inventoryTotals } from "@/lib/inventory";
import { getItem, type Item } from "@/lib/items";
import { moodLevel } from "@/lib/mood";
import { InventoryGrid } from "./inventory-grid";

const navClass =
  "flex size-10 min-w-0 items-center justify-center rounded-full bg-dark-blue text-white shadow-pop transition hover:-translate-y-0.5";

/**
 * Progress: your mood bar (#25), a month calendar with each finished day's
 * mood face (#19), a patch on repaired days (#82) and each week's gift on
 * its last day (#27), then the items you've collected (#18).
 */
export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const score = currentMood(db, user); // also saves any newly finished days
  const today = todayIn(user.timeZone);
  const thisMonth = today.slice(0, 7);
  const month = parseMonth((await searchParams).month, today);
  const weeks = monthGrid(month, user.weekStart);

  // Moods and gifts for every day on the grid, including the other months' edge days.
  const from = weeks[0][0].date;
  const to = weeks.at(-1)!.at(-1)!.date;
  const moodOn = new Map(moodLogBetween(db, user.id, from, to).map(({ date, mood }) => [date, mood]));
  const gifts = new Map<string, Item>();
  for (const { date, itemId } of weeklyGiftsBetween(db, user.id, from, to)) {
    const item = getItem(itemId);
    if (item) gifts.set(date, item);
  }
  const history = dayHistory(db, user.id, today);
  const repaired = new Set(history.repaired);
  const monthDays = weeks.flat().filter((day) => day.inMonth);
  const completeThisMonth = monthDays.filter(({ date }) => history.typeOf(date) === "complete").length;
  const giftsThisMonth = monthDays.filter(({ date }) => gifts.has(date)).length;
  const summary = [
    completeThisMonth > 0 && `${completeThisMonth} complete day${completeThisMonth === 1 ? "" : "s"}`,
    giftsThisMonth > 0 && `${giftsThisMonth} gift${giftsThisMonth === 1 ? "" : "s"}`,
  ].filter(Boolean);

  const groups = groupInventory(listInventory(db, user.id));
  const { total, kinds } = inventoryTotals(groups);

  return (
    <PageCard title="Progress" border="sky">
      <p className="text-caption">
        You&apos;re feeling <strong className="text-ink">{moods[moodLevel(score)].label}</strong>.
      </p>
      <MoodMeter score={score} />

      <section aria-labelledby="calendar-heading" className="mt-2">
        <div className="mb-4 flex items-center justify-between gap-2">
          <Link href={`/progress?month=${addMonths(month, -1)}`} scroll={false} aria-label="Previous month" className={navClass}>
            <IconChevronLeft aria-hidden className="size-5" stroke={2.5} />
          </Link>
          <div className="text-center">
            <h2 id="calendar-heading" className="text-2xl">
              {formatMonth(month)}
            </h2>
            <p className="text-sm text-caption">
              {summary.length === 0 ? "Nothing yet this month" : `${summary.join(" · ")} this month`}
              {month !== thisMonth && (
                <>
                  {" · "}
                  <Link href="/progress" scroll={false} className="underline hover:text-ink">
                    Today
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link href={`/progress?month=${addMonths(month, 1)}`} scroll={false} aria-label="Next month" className={navClass}>
            <IconChevronRight aria-hidden className="size-5" stroke={2.5} />
          </Link>
        </div>

        <table className="w-full table-fixed border-separate border-spacing-1 sm:border-spacing-2">
          <caption className="sr-only">Moods and gifts in {formatMonth(month)}</caption>
          <thead>
            <tr>
              {weekdayLabels(user.weekStart).map((label) => (
                <th key={label} scope="col" className="pb-1 text-xs text-caption sm:text-sm">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0].date}>
                {week.map(({ date, inMonth }) => {
                  const gift = gifts.get(date);
                  const patched = repaired.has(date);
                  const isToday = date === today;
                  // Only finished days have a saved mood, so today shows its number.
                  const mood = moodOn.get(date);
                  const face = mood === undefined ? undefined : moods[moodLevel(mood)];
                  const label = [
                    formatDate(date),
                    face && `feeling ${face.label}`,
                    patched && "streak repaired",
                    gift && `gift: ${gift.name}`,
                  ]
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <td key={date} className="p-0" aria-label={label}>
                      {/* Table cells ignore aspect-ratio, so the circle lives on a div inside. */}
                      <div
                        data-hint={face ? `${face.label} · ${formatDate(date)}` : undefined}
                        className={`relative mx-auto flex aspect-square max-w-16 items-center justify-center rounded-full ${
                          face ? `${face.className} border-2 border-white shadow-pop sm:border-3` : "bg-white/80"
                        } ${isToday ? "ring-3 ring-sky" : ""} ${inMonth ? "" : "opacity-40"}`}
                      >
                        {face ? (
                          <face.Face aria-hidden className="size-4/5 text-ink" stroke={1.75} />
                        ) : (
                          <span
                            aria-hidden
                            className={`text-sm sm:text-lg ${isToday ? "font-black text-sky" : "text-caption"}`}
                          >
                            {Number(date.slice(8))}
                          </span>
                        )}
                        {patched && (
                          <span
                            aria-hidden
                            data-hint="Streak repaired"
                            className="absolute -top-1 -left-1 text-xs sm:text-base"
                          >
                            🩹
                          </span>
                        )}
                        {gift && (
                          <span
                            data-hint={gift.name}
                            className="absolute -right-1 -bottom-1 size-1/2 rounded-full bg-white p-0.5 shadow-pop"
                          >
                            <span className="relative block size-full">
                              <ItemSprite item={gift} size={32} fill />
                            </span>
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section aria-labelledby="items-heading" className="mt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="items-heading" className="text-2xl">
            My treasures
          </h2>
          <p className="text-caption">
            {total === 0 ? "No treasures yet." : `${total} treasure${total === 1 ? "" : "s"}, ${kinds} different`}
          </p>
        </div>
        <InventoryGrid groups={groups} />
      </section>
    </PageCard>
  );
}
