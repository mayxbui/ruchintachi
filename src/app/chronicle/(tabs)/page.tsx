import { db } from "@/db";
import { completedHabitIds, listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { sortHabits } from "@/lib/sort-habits";
import { itemsOn } from "@/lib/today";
import { QuickAdd } from "../quick-add";
import { SortMenu } from "../sort-menu";
import { TodayList } from "../today-list";

/** Today tab: today's tasks to tick off or edit. */
export default async function TodayPage() {
  const user = await requireUser();
  // "Today" follows the user's time zone setting.
  const today = todayIn(user.timeZone);
  // Everything on today's list is due today, so "Next due" falls back to name.
  const habits = sortHabits(
    listHabits(db, user.id).map((h) => ({ ...h, next: today })),
    user.taskSort,
  );
  const items = itemsOn(
    habits,
    listExceptions(db, user.id),
    completedHabitIds(db, user.id, today),
    today,
  );

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-caption">{formatDate(today)}</p>
        <SortMenu sort={user.taskSort} doneLast={user.doneLast} />
      </div>
      <QuickAdd />
      <TodayList items={items} today={today} doneLast={user.doneLast} />
    </section>
  );
}
