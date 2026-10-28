import Link from "next/link";
import { notFound } from "next/navigation";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { carryOverDoneDates, listExceptions } from "@/db/completions";
import { getHabit } from "@/db/habits";
import { listTaskLists } from "@/db/task-lists";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { scheduled } from "@/lib/due-date";
import { formatDate } from "@/lib/describe-rule";
import { isEditableDay, nextOccurrence, seriesFrom } from "@/lib/habit-edit";
import { isHabitIcon } from "@/lib/habit-icons";
import { occurrenceOn } from "@/lib/repeat-rule";
import { deleteHabitAction, editHabitAction, type ReturnTo } from "../../actions";
import { EditHabit } from "./edit-habit";

export default async function EditHabitPage({
  params,
  searchParams,
}: {
  params: Promise<{ habitId: string }>;
  searchParams: Promise<{ date?: string; from?: string; list?: string }>;
}) {
  const user = await requireUser();
  const { habitId } = await params;
  const { date: asked, from, list } = await searchParams;
  // Back to the Tasks filter they came from (the action re-checks this path).
  const returnTo: ReturnTo =
    from === "tasks"
      ? list && /^[\w-]+$/.test(list)
        ? `/chronicle/tasks?list=${list}`
        : "/chronicle/tasks"
      : "/chronicle";
  const saved = getHabit(db, user.id, habitId);
  if (!saved) notFound();

  const today = todayIn(user.timeZone);
  // A carry-over task (one-off with a due date) is edited on the day it sits on.
  const habit = scheduled(saved, today, carryOverDoneDates(db, user.id).get(habitId));
  const exceptions = listExceptions(db, user.id).filter((e) => e.habitId === habitId);
  // The day being edited: the one asked for if it can change, else the next one.
  const date =
    asked && isEditableDay(habit, exceptions, asked, today)
      ? asked
      : nextOccurrence(habit, exceptions, today);

  if (!date) {
    return (
      <PageCard title="Edit">
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
    <PageCard title="Edit">
      <EditHabit
        repeating={repeating}
        dateLabel={formatDate(date)}
        dayName={dayName}
        returnTo={returnTo}
        today={today}
        weekStart={user.weekStart}
        initial={{
          // "This day and future" starts on the chosen day, with what's left of a count.
          ...seriesFrom(habit, date),
          icon: habit.icon && isHabitIcon(habit.icon) ? habit.icon : null,
        }}
        lists={listTaskLists(db, user.id)}
        editDay={editHabitAction.bind(null, habitId, date, "day", returnTo)}
        editFuture={editHabitAction.bind(null, habitId, date, "future", returnTo)}
        deleteDay={deleteHabitAction.bind(null, habitId, date, "day", returnTo)}
        deleteFuture={deleteHabitAction.bind(null, habitId, date, "future", returnTo)}
      />
    </PageCard>
  );
}
