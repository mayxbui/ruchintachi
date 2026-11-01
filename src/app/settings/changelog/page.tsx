import type { Metadata } from "next";
import Link from "next/link";
import { NoReleases, ReleaseDropdown } from "@/components/changelog";
import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";
import { releases } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "Changelog — RuchinDachi",
};

export default async function ChangelogPage() {
  await requireUser();

  return (
    <PageCard title="Changelog" border="sunny">
      <Link href="/settings" className="mb-4 inline-block font-bold text-tangerine hover:underline">
        ← Back to Settings
      </Link>
      {releases.length === 0 ? (
        <NoReleases />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {/* Newest starts open; the rest start folded. */}
          {releases.map((release, i) => (
            <ReleaseDropdown key={release.version} release={release} current={i === 0} />
          ))}
        </div>
      )}
    </PageCard>
  );
}
