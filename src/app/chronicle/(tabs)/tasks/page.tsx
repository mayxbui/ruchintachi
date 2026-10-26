import { IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { db } from "@/db";
import { listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { describeRule } from "@/lib/describe-rule";
import { nextOccurrence } from "@/lib/habit-edit";
import { iconEmoji } from "@/lib/habit-icons";

/** Tasks tab: every current task with its repeat rule. Filters come with #55. */
export default async function TasksPage() {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const exceptions = listExceptions(db, user.id);
  // Current tasks with the next day they come up; finished series drop off the list.
  const current = listHabits(db, user.id).flatMap((habit) => {
    const next = nextOccurrence(
      habit,
      exceptions.filter((e) => e.habitId === habit.id),
      today,
    );
    return next ? [{ ...habit, next }] : [];
  });

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3 py-2">
        <Link
          href="/chronicle/new"
          className="rounded-full bg-tangerine px-5 py-2 font-bold text-white shadow-pop transition hover:brightness-105"
        >
          + Create a task
        </Link>
      </div>

      {current.length === 0 ? (
        <p className="text-caption">No tasks yet. Add one to start filling your calendar!</p>
      ) : (
        <ul className="space-y-5">
          {current.map((habit) => (
            <li
              key={habit.id}
              className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop"
            >
              <span className="w-8 shrink-0 text-center text-2xl" aria-hidden>
                {iconEmoji(habit.icon) ?? "•"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold break-words">{habit.name}</span>
                <span className="block text-caption text-sm">
                  {describeRule(habit, user.weekStart)}
                </span>
                {habit.note && (
                  <span className="mt-1 py-[1.5] block text-gray-700 break-words whitespace-pre-line">
                    {habit.note}
                  </span>
                )}
              </span>
              <Link
                href={`/chronicle/${habit.id}/edit?date=${habit.next}&from=tasks`}
                aria-label={`Edit ${habit.name}`}
                className="shrink-0 rounded-full p-2 text-caption transition hover:bg-sand hover:text-ink"
              >
                <IconPencil className="size-5" stroke={2.25} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
