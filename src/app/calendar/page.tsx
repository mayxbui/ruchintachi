import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { ItemSprite } from "@/components/item-sprite";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { dayHistory } from "@/db/streak";
import { weeklyGiftsBetween } from "@/db/weekly-gifts";
import { requireUser } from "@/lib/auth/session";
import { addMonths, formatMonth, monthGrid, parseMonth, weekdayLabels } from "@/lib/calendar";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { getItem, type Item } from "@/lib/items";

const navClass =
  "flex size-10 min-w-0 items-center justify-center rounded-full bg-dark-blue text-white shadow-pop transition hover:-translate-y-0.5";

/**
 * Month grid (#19): a rubber-duck stamp on each complete day, and each
 * week's gift on its last day (#27).
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const thisMonth = today.slice(0, 7);
  const month = parseMonth((await searchParams).month, today);
  const weeks = monthGrid(month, user.weekStart);

  // Gifts for every day on the grid, including the other months' edge days.
  const from = weeks[0][0].date;
  const to = weeks.at(-1)!.at(-1)!.date;
  const gifts = new Map<string, Item>();
  for (const { date, itemId } of weeklyGiftsBetween(db, user.id, from, to)) {
    const item = getItem(itemId);
    if (item) gifts.set(date, item);
  }
  const history = dayHistory(db, user.id, today);
  const monthDays = weeks.flat().filter((day) => day.inMonth);
  const completeThisMonth = monthDays.filter(({ date }) => history.typeOf(date) === "complete").length;
  const giftsThisMonth = monthDays.filter(({ date }) => gifts.has(date)).length;
  const summary = [
    completeThisMonth > 0 && `${completeThisMonth} complete day${completeThisMonth === 1 ? "" : "s"}`,
    giftsThisMonth > 0 && `${giftsThisMonth} gift${giftsThisMonth === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <PageCard title="Calendar" border="sky">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/calendar?month=${addMonths(month, -1)}`} aria-label="Previous month" className={navClass}>
          <IconChevronLeft aria-hidden className="size-5" stroke={2.5} />
        </Link>
        <div className="text-center">
          <h2 className="text-2xl">{formatMonth(month)}</h2>
          <p className="text-sm text-caption">
            {summary.length === 0 ? "Nothing stamped yet this month" : `${summary.join(" · ")} this month`}
            {month !== thisMonth && (
              <>
                {" · "}
                <Link href="/calendar" className="underline hover:text-ink">
                  Today
                </Link>
              </>
            )}
          </p>
        </div>
        <Link href={`/calendar?month=${addMonths(month, 1)}`} aria-label="Next month" className={navClass}>
          <IconChevronRight aria-hidden className="size-5" stroke={2.5} />
        </Link>
      </div>

      <table className="w-full table-fixed border-separate border-spacing-1 sm:border-spacing-2">
        <caption className="sr-only">Stamps and gifts in {formatMonth(month)}</caption>
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
                const complete = history.typeOf(date) === "complete";
                const isToday = date === today;
                const label = [formatDate(date), complete && "every habit done", gift && `gift: ${gift.name}`]
                  .filter(Boolean)
                  .join(", ");
                return (
                  <td key={date} className="p-0" aria-label={label}>
                    {/* Table cells ignore aspect-ratio, so the square lives on a div inside. */}
                    <div
                      className={`relative aspect-square rounded-xl sm:rounded-2xl ${
                        inMonth ? "bg-white shadow-pop" : "bg-white/40"
                      } ${isToday ? "ring-3 ring-sky !bg-light-sky/60" : ""}`}
                    >
                      <span
                        aria-hidden
                        className={`absolute top-0.5 left-1 text-xs sm:top-1 sm:left-2 sm:text-sm ${
                          isToday ? "font-black text-sky" : inMonth ? "text-ink" : "text-caption/60"
                        }`}
                      >
                        {Number(date.slice(8))}
                      </span>
                      {complete && (
                        <span
                          className={`absolute ${
                            gift ? "top-0.5 right-0.5 size-1/3" : "bottom-1 left-1/2 size-3/5 -translate-x-1/2 sm:bottom-2"
                          } ${inMonth ? "" : "opacity-50"}`}
                          data-hint="Every habit done"
                        >
                          <Image src="/items/Treasure040.png" alt="" fill sizes="64px" className="object-contain" />
                        </span>
                      )}
                      {gift && (
                        <span
                          className={`absolute bottom-1 left-1/2 size-4/5 -translate-x-1/2 sm:bottom-2 ${
                            inMonth ? "" : "opacity-50"
                          }`}
                          data-hint={gift.name}
                        >
                          <ItemSprite item={gift} size={64} fill />
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
    </PageCard>
  );
}
