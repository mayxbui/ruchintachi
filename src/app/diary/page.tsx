import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";

export default async function DiaryPage() {
  await requireUser();
  return (
    <PageCard title="My Diary">
      <p className="text-caption">
        Today&apos;s tasks and your habit list will live here.
      </p>
    </PageCard>
  );
}
