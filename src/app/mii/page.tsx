import { IconGift } from "@tabler/icons-react";
import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { MoodBubble, moods } from "@/components/mood-bubble";
import { db } from "@/db";
import { currentMood } from "@/db/mood";
import { requireUser } from "@/lib/auth/session";
import { moodLevel } from "@/lib/mood";

export default async function MiiPage() {
  const user = await requireUser();
  const mood = moodLevel(currentMood(db, user));
  const label = moods.find((m) => m.id === mood)!.label;
  return (
    <PageCard title="Mii" border="pink">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          Your Mii is feeling <strong className="text-ink">{label}</strong>.
        </p>
        <Link
          href="/mii/inventory"
          className="flex items-center gap-2 rounded-full bg-blossom px-4 py-2 font-bold text-white shadow-pop transition hover:-translate-y-0.5"
        >
          <IconGift aria-hidden className="size-6" stroke={2.25} />
          My items
        </Link>
      </div>
      {/* All five moods, best to worst; today's stands out (#25). */}
      <ul className="flex flex-wrap gap-4">
        {moods.map(({ id }) => (
          <li
            key={id}
            aria-current={id === mood ? "true" : undefined}
            className={id === mood ? "" : "opacity-35"}
          >
            <MoodBubble mood={id} />
          </li>
        ))}
      </ul>
    </PageCard>
  );
}
