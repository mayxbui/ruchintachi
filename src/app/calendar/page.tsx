import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";

export default async function CalendarPage() {
  await requireUser();
  return (
    <PageCard title="Calendar">
      <p className="text-caption">
        Your month fills up with gifts as you keep your habits.
      </p>
    </PageCard>
  );
}
