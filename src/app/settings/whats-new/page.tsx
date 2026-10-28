import type { Metadata } from "next";
import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { requireUser } from "@/lib/auth/session";
import { formatUpdateDate, updates } from "@/lib/whats-new";

export const metadata: Metadata = {
  title: "What's new — RuchinDachi",
};

export default async function WhatsNewPage() {
  await requireUser();

  return (
    <PageCard title="What's new" border="sunny">
      <Link href="/settings" className="mb-4 inline-block font-bold text-tangerine hover:underline">
        ← Back to Settings
      </Link>
      <ol className="space-y-3 sm:space-y-4">
        {updates.map((update, i) => (
          <li key={update.date} className="rounded-2xl bg-white px-4 py-3 shadow-pop sm:px-5 sm:py-4">
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-caption">
              <time dateTime={update.date}>{formatUpdateDate(update.date)}</time>
              {i === 0 && (
                <span className="rounded-full bg-tangerine px-2 py-0.5 text-xs text-white">New</span>
              )}
            </p>
            <h2 className="mt-1 text-lg font-black sm:text-xl">{update.title}</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {update.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </PageCard>
  );
}
