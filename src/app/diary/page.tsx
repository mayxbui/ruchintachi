import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { completedHabitIds, listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { describeRule, formatDate } from "@/lib/describe-rule";
import { iconEmoji } from "@/lib/habit-icons";
import { itemsOn } from "@/lib/today";
import { TodayList } from "./today-list";

export default async function DiaryPage() {
  const user = await requireUser();
  const habits = listHabits(db, user.id);
  // "Today" follows the user's time zone setting.
  const today = todayIn(user.timeZone);
  const todayItems = itemsOn(
    habits,
    listExceptions(db, user.id),
    completedHabitIds(db, user.id, today),
    today,
  );

  return (
    <PageCard title="My Diary">
      <section className="mb-8">
        <h2 className="mb-1 text-xl">Today</h2>
        <p className="mb-3 text-caption">{formatDate(today)}</p>
        <TodayList items={todayItems} />
      </section>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">My habits</h2>
        <Link
          href="/diary/new"
          className="rounded-full bg-tangerine px-5 py-2 font-bold text-white shadow-pop transition hover:brightness-105"
        >
          + Create a task
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="text-caption">No habits yet. Add one to start filling your calendar!</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop"
            >
              <span className="w-8 shrink-0 text-center text-2xl" aria-hidden>
                {iconEmoji(habit.icon) ?? "•"}
              </span>
              <span className="min-w-0">
                <span className="block font-bold break-words">{habit.name}</span>
                <span className="block text-caption">
                  {describeRule(habit, user.weekStart)}
                </span>
                {habit.note && (
                  <span className="mt-1 py-[1.5] block text-gray-700 break-words whitespace-pre-line">
                    {habit.note}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageCard>
  );
}
