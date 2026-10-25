import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { describeRule } from "@/lib/describe-rule";
import { iconEmoji } from "@/lib/habit-icons";

export default async function DiaryPage() {
  const user = await requireUser();
  const habits = listHabits(db, user.id);

  return (
    <PageCard title="My Diary">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl">My habits</h2>
        <Link
          href="/diary/new"
          className="rounded-full bg-tangerine px-5 py-2 font-bold text-white shadow-pop transition hover:brightness-105"
        >
          + New habit
        </Link>
      </div>

      {habits.length === 0 ? (
        <p className="text-caption">No habits yet. Add one to start filling your calendar!</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop"
            >
              <span className="text-2xl" aria-hidden>
                {iconEmoji(habit.icon)}
              </span>
              <span className="min-w-0">
                <span className="block font-bold break-words">{habit.name}</span>
                <span className="block text-caption">
                  {describeRule(habit, user.weekStart)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </PageCard>
  );
}
