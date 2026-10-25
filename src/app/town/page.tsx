import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";

export default async function TownPage() {
  await requireUser();
  return (
    <PageCard title="Town">
      <p className="text-ink/70">
        Share your friend code and visit your friends&apos; Miis.
      </p>
    </PageCard>
  );
}
