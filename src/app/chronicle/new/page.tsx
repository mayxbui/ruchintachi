import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { NewHabitForm } from "./new-habit-form";

export default async function NewHabitPage() {
  const user = await requireUser();
  return (
    <PageCard title="Create a task">
      <NewHabitForm today={todayIn(user.timeZone)} weekStart={user.weekStart} />
    </PageCard>
  );
}
