import { IconPlus } from "@tabler/icons-react";
import type { Metadata } from "next";
import { moods } from "@/components/mood-meter";
import { StatPills } from "@/components/stat-pills";
import { db } from "@/db";
import { coinBalance } from "@/db/coins";
import { currentMood } from "@/db/mood";
import { streakFor } from "@/db/streak";
import { todayItems } from "@/db/today";
import { getCurrentUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { moodLevel } from "@/lib/mood";
import { QuickAdd } from "../chronicle/quick-add";
import { TimerProvider } from "../chronicle/timer";
import { TodayList } from "../chronicle/today-list";
import { WidgetRefresh } from "./widget-refresh";

export const metadata: Metadata = { title: "Today · RuchinDachi" };

/**
 * A small, chrome-free page for the pop-out desktop widget (#65, #66): a top
 * bar with your mood, streak and coins, "+ Habit" (habits are made on
 * the main site) and quick-add for one-off tasks, then today's tasks and
 * habits, whose names and icons can be changed in place. The root
 * layout hides the header and footer here.
 */
export default async function WidgetPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <p className="rounded-2xl bg-cream/90 py-10 text-center shadow-pop">
        <a href="/sign-in" target="_blank" rel="noopener" className="font-bold text-caption underline">
          Sign in on RuchinDachi
        </a>
      </p>
    );
  }

  const today = todayIn(user.timeZone);
  const { label, className, Face } = moods[moodLevel(currentMood(db, user))];
  return (
    <section className="space-y-3">
      <WidgetRefresh />
      <header className="sticky top-0 z-10 space-y-2 rounded-2xl bg-cream/95 p-2 shadow-pop">
        <div className="flex items-center gap-2">
          <span
            role="img"
            aria-label={`You're feeling ${label}`}
            data-hint={`${label} · ${formatDate(today)}`}
            className={`flex size-10 shrink-0 items-center justify-center rounded-full border-3 border-white text-ink shadow-pop ${className}`}
          >
            <Face aria-hidden className="size-7" stroke={1.75} />
          </span>
          <StatPills streak={streakFor(db, user.id, today)} coins={coinBalance(db, user.id)} />
          {/* Habits need the full form, in a normal tab of the main site. */}
          <a
            href="/chronicle/new"
            target="_blank"
            rel="noopener"
            data-hint="Make a habit on RuchinDachi"
            className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-tangerine px-3 py-2 text-sm font-bold text-white shadow-pop"
          >
            <IconPlus aria-hidden className="size-4" stroke={3} />
            Habit
          </a>
        </div>
        <div className="[&_form]:mb-0">
          <QuickAdd today={today} weekStart={user.weekStart} />
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
