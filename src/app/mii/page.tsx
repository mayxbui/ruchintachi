import Image from "next/image";
import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { MoodBubble, moods } from "@/components/mood-bubble";
import { requireUser } from "@/lib/auth/session";

export default async function MiiPage() {
  await requireUser();
  return (
    <PageCard title="Mii">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          Create your Mii, dress it up and see how it&apos;s feeling.
        </p>
        <Link
          href="/mii/inventory"
          className="flex items-center gap-2 rounded-full bg-tangerine px-4 py-2 font-bold text-white shadow-pop transition hover:-translate-y-0.5"
        >
          {/* The game's paper bag icon; Next serves a resized copy. */}
          <Image src="/ItemPaperbag.png" alt="" width={28} height={28} className="size-7" />
          My items
        </Link>
      </div>
      <ul className="flex flex-wrap gap-4">
        {moods.map((mood) => (
          <li key={mood.id}>
            <MoodBubble mood={mood.id} />
          </li>
        ))}
      </ul>
    </PageCard>
  );
}
