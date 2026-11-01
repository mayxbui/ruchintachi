import { db } from "@/db";
import { coinBalance } from "@/db/coins";
import { repairOfferFor, streakFor } from "@/db/streak";
import { todayItems } from "@/db/today";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { QuickAdd } from "../quick-add";
import { RepairBanner } from "../repair-banner";
import { SortMenu } from "../sort-menu";
import { CoinPill, StreakPill } from "../stat-pills";
import { TodayList } from "../today-list";

/** Today tab: today's tasks to tick off or edit. */
export default async function TodayPage() {
  const user = await requireUser();
  // "Today" follows the user's time zone setting.
  const today = todayIn(user.timeZone);
  const items = todayItems(db, user.id, today, user.taskSort);
  const streak = streakFor(db, user.id, today);
  const coins = coinBalance(db, user.id);
  const repair = repairOfferFor(db, user, today);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-caption">{formatDate(today)}</p>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <StreakPill streak={streak} />
          <CoinPill coins={coins} />
        </div>
        <SortMenu sort={user.taskSort} doneLast={user.doneLast} />
      </div>
      {repair && <RepairBanner streak={repair.streak} coins={coins} />}
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
