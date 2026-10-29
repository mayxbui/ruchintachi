import { IconGift } from "@tabler/icons-react";
import Link from "next/link";
import { PageCard } from "@/components/page-card";
import { MoodMeter, moods } from "@/components/mood-meter";
import { db } from "@/db";
import { habitOccurrencesBetween } from "@/db/completion-rate";
import { currentMood, moodLogBetween } from "@/db/mood";
import { requireUser } from "@/lib/auth/session";
import { addDays, todayIn } from "@/lib/dates";
import { moodLevel } from "@/lib/mood";
import {
  MOOD_RANGES,
  hasMoodHistory,
  moodRangeStart,
  moodSeries,
  parseMoodRange,
  type MoodRange,
} from "@/lib/mood-history";
import { CompletionRings } from "./completion-rings";
import { MoodChart } from "./mood-chart";

export default async function MiiPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await requireUser();
  const range = parseMoodRange((await searchParams).range);
  const score = currentMood(db, user); // also saves any newly finished days
  const today = todayIn(user.timeZone);
  const from = moodRangeStart(today, range);
  const points = moodSeries(moodLogBetween(db, user.id, from, addDays(today, -1)), from, today, score);

  // This month so far, for the completion rings (#24).
  const occurrences = habitOccurrencesBetween(db, user.id, `${today.slice(0, 7)}-01`, today);

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

      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">Mood over time</h2>
          <nav aria-label="Mood chart range" className="flex gap-2">
            {(Object.keys(MOOD_RANGES) as MoodRange[]).map((id) => (
              <Link
                key={id}
                href={`/mii?range=${id}`}
                scroll={false}
                aria-current={id === range ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-bold shadow-pop transition ${
                  id === range ? "bg-blossom text-white" : "bg-white text-slate-500 hover:text-ink"
                }`}
              >
                {MOOD_RANGES[id].label}
              </Link>
            ))}
          </nav>
        </div>
        {hasMoodHistory(points) ? (
          <MoodChart points={points} />
        ) : (
          <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-caption">
            Your mood chart starts after your first full day.
          </p>
        )}
      </section>

      <CompletionRings occurrences={occurrences} />
    </PageCard>
  );
}
