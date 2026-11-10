import { Suspense, type ReactNode } from "react";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { awardFinishedWeeks, unrevealedWeeklyGifts } from "@/db/weekly-gifts";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { formatDate } from "@/lib/describe-rule";
import { getItem } from "@/lib/items";
import { ChronicleTabs } from "../chronicle-tabs";
import { WeeklyGifts } from "../weekly-gifts";

/**
 * My Chronicle with its Today / Tasks sub-tabs. Opening it awards any finished week's gift and plays its reveal (#27).
 */
export default async function ChronicleLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  awardFinishedWeeks(db, user, todayIn(user.timeZone));
  const gifts = unrevealedWeeklyGifts(db, user.id).flatMap(({ weekStartDate, itemId }) => {
    const item = getItem(itemId);
    if (!item) return [];
    const { id, name, category, sprite } = item;
    return [{ weekStartDate, note: `For the week of ${formatDate(weekStartDate)}`, item: { id, name, category, sprite } }];
  });

  return (
    <PageCard title="My Chronicle">
        {/* The tabs read ?list= for "Create a task". */}
        <Suspense>
          <ChronicleTabs />
        </Suspense>
        {children}
      <WeeklyGifts gifts={gifts} />
    </PageCard>
  );
}
