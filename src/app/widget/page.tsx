import type { Metadata } from "next";
import { moods } from "@/components/mood-meter";
import { db } from "@/db";
import { currentMood } from "@/db/mood";
import { todayItems } from "@/db/today";
import { getCurrentUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { moodLevel } from "@/lib/mood";
import { TimerProvider } from "../chronicle/timer";
import { TodayList } from "../chronicle/today-list";
import { WidgetRefresh } from "./widget-refresh";

export const metadata: Metadata = { title: "Today · RuchinDachi" };

/**
 * A small, chrome-free page with today's checklist and the Mii's mood (#65),
 * for the pop-out desktop widget. The root layout hides the header and footer here.
 */
export default async function WidgetPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="rounded-blob bg-cream/90 py-10 text-center shadow-pop">
        <a href="/sign-in" target="_blank" rel="noopener" className="font-bold text-caption underline">
          Sign in on RuchinDachi
        </a>
      </p>
    );
  }

  const today = todayIn(user.timeZone);
  const { label, className, Face } = moods[moodLevel(currentMood(db, user))];
  return (
    <section className="space-y-3 rounded-blob bg-cream/90 p-3 shadow-pop">
      <WidgetRefresh />
      <header className="flex items-center gap-3">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-full border-3 border-white text-ink shadow-pop ${className}`}
        >
          <Face aria-hidden className="size-8" stroke={1.75} />
        </span>
        <div className="min-w-0">
          <p className="font-bold">{label}</p>
          <p className="truncate text-sm text-caption">{formatDate(today)}</p>
        </div>
      </header>
      <TimerProvider>
        <TodayList
          items={todayItems(db, user.id, today, user.taskSort)}
          today={today}
          doneLast={user.doneLast}
          reorderable={false}
          compact
        />
      </TimerProvider>
    </section>
  );
}
