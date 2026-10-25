import Link from "next/link";
import { db } from "@/db";
import { completedHabitIds, listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { itemsOn } from "@/lib/today";
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
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">{formatDate(today)}</p>
        <Link
          href="/chronicle/new"
          className="rounded-full bg-tangerine px-5 py-2 font-bold text-white shadow-pop transition hover:brightness-105"
        >
          + Create a task
        </Link>
      </div>
      <TodayList items={items} today={today} />
    </section>
  );
}
