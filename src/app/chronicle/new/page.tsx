import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { createHabitAction } from "../actions";
import { HabitForm } from "../habit-form";

export default async function NewHabitPage() {
  const user = await requireUser();
  return (
    <PageCard title="Create a task">
      <HabitForm
        today={todayIn(user.timeZone)}
        weekStart={user.weekStart}
        action={createHabitAction}
        submitLabel="Create task"
        pendingLabel="Creating…"
      />
    </PageCard>
  );
}
