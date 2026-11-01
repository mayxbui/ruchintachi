import { db } from "@/db";
import { streakFor } from "@/db/streak";
import { todayItems } from "@/db/today";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { QuickAdd } from "../quick-add";
import { SortMenu } from "../sort-menu";
import { StreakPill } from "../stat-pills";
import { TodayList } from "../today-list";

/** Today tab: today's tasks to tick off or edit. */
export default async function TodayPage() {
  const user = await requireUser();
  // "Today" follows the user's time zone setting.
  const today = todayIn(user.timeZone);
  const items = todayItems(db, user.id, today, user.taskSort);
  const streak = streakFor(db, user.id, today);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-caption">{formatDate(today)}</p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <StreakPill streak={streak} />
        </div>
        <SortMenu sort={user.taskSort} doneLast={user.doneLast} />
      </div>
      <QuickAdd today={today} weekStart={user.weekStart} />
      <TodayList
        items={items}
        today={today}
        doneLast={user.doneLast}
        reorderable={user.taskSort === "custom"}
      />
    </section>
  );
}
