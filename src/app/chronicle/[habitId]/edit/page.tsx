import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { listExceptions } from "@/db/completions";
import { getHabit } from "@/db/habits";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { isEditableDay, nextOccurrence, remainingCount } from "@/lib/habit-edit";
import { isHabitIcon } from "@/lib/habit-icons";
import { occurrenceOn } from "@/lib/repeat-rule";
import { deleteHabitAction, editHabitAction, type ReturnTo } from "../../actions";
import { EditHabit } from "./edit-habit";

export default async function EditHabitPage({
  params,
  searchParams,
}: {
  params: Promise<{ habitId: string }>;
  searchParams: Promise<{ date?: string; from?: string }>;
}) {
  const user = await requireUser();
  const { habitId } = await params;
  const { date: asked, from } = await searchParams;
  const returnTo: ReturnTo = from === "tasks" ? "/chronicle/tasks" : "/chronicle";
  const habit = getHabit(db, user.id, habitId);
  if (!habit) notFound();

  const today = todayIn(user.timeZone);
  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  // The day being edited: the one asked for if it can change, else the next one.
  const date =
    asked && isEditableDay(habit, exceptions, asked, today)
      ? asked
      : nextOccurrence(habit, exceptions, today);

  if (!date) {
    return (
      <PageCard title="Edit task">
        <p className="mb-4 text-caption">
          &ldquo;{habit.name}&rdquo; has no days left, and past days stay as they were.
        </p>
        <Link href={returnTo} className="font-bold text-caption hover:brightness-75">
          Back to My Chronicle
        </Link>
      </PageCard>
    );
  }

  const repeating = habit.frequency !== "none";
  const dayName = occurrenceOn(habit, date, exceptions)?.name ?? habit.name;

  return (
    <PageCard title="Edit task">
      <EditHabit
        repeating={repeating}
        dateLabel={formatDate(date)}
        dayName={dayName}
        returnTo={returnTo}
        today={today}
        weekStart={user.weekStart}
        initial={{
          ...habit,
          icon: habit.icon && isHabitIcon(habit.icon) ? habit.icon : null,
          // "This day and future" starts on the chosen day, with what's left of a count.
          startDate: repeating ? date : habit.startDate,
          endCount: remainingCount(habit, date) ?? habit.endCount,
        }}
        editDay={editHabitAction.bind(null, habitId, date, "day", returnTo)}
        editFuture={editHabitAction.bind(null, habitId, date, "future", returnTo)}
        deleteDay={deleteHabitAction.bind(null, habitId, date, "day", returnTo)}
        deleteFuture={deleteHabitAction.bind(null, habitId, date, "future", returnTo)}
      />
    </PageCard>
  );
}
