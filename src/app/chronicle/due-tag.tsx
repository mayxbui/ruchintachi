import { IconCalendarDue } from "@tabler/icons-react";
import { dueLabel } from "@/lib/due-date";

/** A one-off task's due date as a small pill; red once it's overdue. */
export function DueTag({ dueDate, today }: { dueDate: string; today: string }) {
  const { text, overdue } = dueLabel(dueDate, today);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 text-sm font-bold ${
        overdue ? "bg-cherry/15 text-cherry" : "bg-tangerine/15 text-tangerine"
      }`}
    >
      <IconCalendarDue aria-hidden className="size-3.5" stroke={2.5} />
      {text}
    </span>
  );
}
