import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { listTaskLists } from "@/db/task-lists";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { createHabitAction } from "../actions";
import { HabitForm } from "../habit-form";

export default async function NewHabitPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const user = await requireUser();
  const lists = listTaskLists(db, user.id);
  // Opened from one of the user's lists: file it there and go back to it.
  const { list } = await searchParams;
  const fromList = lists.find((l) => l.id === list)?.id;
  const returnTo = fromList ? `/chronicle/tasks?list=${fromList}` : "/chronicle";
  return (
    <PageCard title="Create a task">
      <HabitForm
        today={todayIn(user.timeZone)}
        weekStart={user.weekStart}
        action={createHabitAction.bind(null, returnTo)}
        lists={lists}
        defaultListId={fromList}
        cancelHref={returnTo}
        submitLabel="Create task"
        pendingLabel="Creating…"
      />
    </PageCard>
  );
}
