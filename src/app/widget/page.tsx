import { IconPlus } from "@tabler/icons-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { moods } from "@/components/mood-meter";
import { db } from "@/db";
import { currentMood } from "@/db/mood";
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
 * A small, chrome-free page with today's checklist and the Mii's mood (#65),
 * drawn as a mini laptop: mood on the left of the screen, checklist on the
 * right. Quick-add makes one-off tasks; habits are made on the main site
 * (#66). The pop-out desktop widget shows it; the root layout hides the
 * header and footer here.
 */
export default async function WidgetPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Laptop>
        <div className="flex flex-1 items-center justify-center">
          <a href="/sign-in" target="_blank" rel="noopener" className="font-bold text-caption underline">
            Sign in on RuchinDachi
          </a>
        </div>
      </Laptop>
    );
  }

  const today = todayIn(user.timeZone);
  const { label, className, Face } = moods[moodLevel(currentMood(db, user))];
  return (
    <Laptop>
      <WidgetRefresh />
      <aside className="flex w-[36%] shrink-0 flex-col items-center justify-center gap-1.5 bg-sand p-2 text-center">
        <span
          className={`flex size-14 items-center justify-center rounded-full border-4 border-white text-ink shadow-pop ${className}`}
        >
          <Face aria-hidden className="size-10" stroke={1.75} />
        </span>
        <p className="font-bold">{label}</p>
        <p className="text-xs text-caption">{formatDate(today)}</p>
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto p-2.5 text-sm">
        <div className="flex items-start gap-1.5">
          <div className="min-w-0 flex-1">
            <QuickAdd today={today} weekStart={user.weekStart} />
          </div>
          {/* Habits need the full form, in a normal tab of the main site. */}
          <a
            href="/chronicle/new"
            target="_blank"
            rel="noopener"
            data-hint="Make a habit on RuchinDachi"
            className="mt-1 flex shrink-0 items-center gap-0.5 rounded-full bg-tangerine px-2.5 py-1.5 text-xs font-bold text-white shadow-pop"
          >
            <IconPlus aria-hidden className="size-3.5" stroke={3} />
            Habit
          </a>
        </div>
        <TimerProvider>
          <TodayList
            items={todayItems(db, user.id, today, user.taskSort)}
            today={today}
            doneLast={user.doneLast}
            reorderable={false}
            compact
          />
        </TimerProvider>
      </div>
    </Laptop>
  );
}

/** A little laptop: dark bezel round a 16:10 cream screen, on a sand base. */
function Laptop({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[520px] px-3">
      <div className="relative rounded-t-[1.6rem] rounded-b-lg bg-ink p-2.5 pt-4 shadow-pop">
        <span aria-hidden className="absolute top-1.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-white/30" />
        <div className="flex aspect-[16/10] overflow-hidden rounded-xl bg-cream">{children}</div>
      </div>
      <div className="-mx-3 h-3.5 rounded-t-sm rounded-b-2xl bg-sand-deep shadow-pop">
        <div className="mx-auto h-1.5 w-16 rounded-b-lg bg-caption/25" />
      </div>
    </div>
  );
}
