import { notFound } from "next/navigation";
import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";
import { townEnabled } from "@/lib/features";

export default async function TownPage() {
  if (!townEnabled()) notFound(); // still being built (M8)
  await requireUser();
  return (
    <PageCard title="Town">
      <p className="text-caption">
        Share your friend code and see how your friends are doing.
      </p>
    </PageCard>
  );
}
