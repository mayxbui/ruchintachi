import { IconGift } from "@tabler/icons-react";
import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { MoodMeter, moods } from "@/components/mood-meter";
import { db } from "@/db";
import { currentMood } from "@/db/mood";
import { requireUser } from "@/lib/auth/session";
import { moodLevel } from "@/lib/mood";

export default async function MiiPage() {
  const user = await requireUser();
  const score = currentMood(db, user);
  return (
    <PageCard title="Mii" border="pink">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          Your Mii is feeling <strong className="text-ink">{moods[moodLevel(score)].label}</strong>.
        </p>
        <Link
          href="/mii/inventory"
          className="flex items-center gap-2 rounded-full bg-blossom px-4 py-2 font-bold text-white shadow-pop transition hover:-translate-y-0.5"
        >
          <IconGift aria-hidden className="size-6" stroke={2.25} />
          My items
        </Link>
      </div>
      <MoodMeter score={score} />
    </PageCard>
  );
}
