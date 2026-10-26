import { db } from "@/db";
import { completedHabitIds, listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { itemsOn } from "@/lib/today";
import { QuickAdd } from "../quick-add";
import { TodayList } from "../today-list";

/** Today tab: today's tasks to tick off or edit. */
export default async function TodayPage() {
  const user = await requireUser();
  // "Today" follows the user's time zone setting.
  const today = todayIn(user.timeZone);
  const items = itemsOn(
    listHabits(db, user.id),
    listExceptions(db, user.id),
    completedHabitIds(db, user.id, today),
    today,
  );

  return (
    <section>
      <p className="mb-3 text-caption">{formatDate(today)}</p>
      <QuickAdd />
      <TodayList items={items} today={today} />
    </section>
  );
}
