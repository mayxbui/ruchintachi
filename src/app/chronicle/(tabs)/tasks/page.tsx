import { IconPencil } from "@tabler/icons-react";
import Link from "next/link";
import { db } from "@/db";
import { listExceptions } from "@/db/completions";
import { listHabits } from "@/db/habits";
import { listTaskLists } from "@/db/task-lists";
import { requireUser } from "@/lib/auth/session";
import { todayIn } from "@/lib/dates";
import { describeRule } from "@/lib/describe-rule";
import { nextOccurrence } from "@/lib/habit-edit";
import { iconEmoji } from "@/lib/habit-icons";
import {
  filterParam,
  filterTasks,
  nextDateLabel,
  parseTaskFilter,
  UP_NEXT_DAYS,
  type TaskFilter,
} from "@/lib/task-lists";
import { ListMenu, NewList } from "./list-controls";

const tasksHref = (filter: TaskFilter) => {
  const param = filterParam(filter);
  return param ? `/chronicle/tasks?list=${param}` : "/chronicle/tasks";
};

/** A filter pill. The active one is filled in. */
function FilterPill({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`max-w-48 shrink-0 truncate rounded-full px-4 py-1.5 font-bold shadow-pop transition ${
        active ? "bg-sky text-white" : "bg-white text-slate-500 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

/** Tasks tab: every current task, filtered by Up next, All, or one of the user's lists. */
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string }>;
}) {
  const user = await requireUser();
  const today = todayIn(user.timeZone);
  const lists = listTaskLists(db, user.id);
  const filter = parseTaskFilter((await searchParams).list, lists.map((l) => l.id));
  const activeList = filter.kind === "list" ? lists.find((l) => l.id === filter.listId) : undefined;
  const listName = new Map(lists.map((l) => [l.id, l.name]));

  const exceptions = listExceptions(db, user.id);
  // Current tasks with the next day they come up; finished series drop off the list.
  const current = listHabits(db, user.id).flatMap((habit) => {
    const next = nextOccurrence(
      habit,
      exceptions.filter((e) => e.habitId === habit.id),
      today,
    );
    return next ? [{ ...habit, next }] : [];
  });
  const shown = filterTasks(current, filter, today);
  const param = filterParam(filter);

  const empty =
    current.length === 0
      ? "No tasks yet. Add one to start filling your calendar!"
      : filter.kind === "next"
        ? `Nothing coming up in the next ${UP_NEXT_DAYS} days.`
        : filter.kind === "list"
          ? "No tasks in this list yet. Create one here, or pick this list when editing a task."
          : "No tasks yet.";

  return (
    <section>
      <nav aria-label="Filter tasks" className="mb-4 flex flex-wrap items-center gap-2">
        <FilterPill href={tasksHref({ kind: "next" })} active={filter.kind === "next"}>
          Up next
        </FilterPill>
        <FilterPill href={tasksHref({ kind: "all" })} active={filter.kind === "all"}>
          All
        </FilterPill>
        {lists.map((list) => (
          <FilterPill
            key={list.id}
            href={tasksHref({ kind: "list", listId: list.id })}
            active={activeList?.id === list.id}
          >
            {list.name}
          </FilterPill>
        ))}
        <NewList />
      </nav>

      {activeList && <ListMenu key={activeList.id} listId={activeList.id} name={activeList.name} />}

      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3 py-2">
        <Link
          href={activeList ? `/chronicle/new?list=${activeList.id}` : "/chronicle/new"}
          className="rounded-full bg-tangerine px-5 py-2 font-bold text-white shadow-pop transition hover:brightness-105"
        >
          + Create a task
        </Link>
      </div>

      {shown.length === 0 ? (
        <p className="text-caption">{empty}</p>
      ) : (
        <ul className="space-y-5">
          {current.map((habit) => (
            <li
              key={habit.id}
              className="flex items-start gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop"
            >
              <span className="w-8 shrink-0 text-center text-2xl" aria-hidden>
                {iconEmoji(habit.icon) ?? "•"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold break-words">{habit.name}</span>
                <span className="block text-caption text-sm">
                  {filter.kind === "next"
                    ? nextDateLabel(habit.next, today)
                    : describeRule(habit, user.weekStart)}
                  {/* Which list it's in, unless we're looking at that list. */}
                  {habit.listId && !activeList && (
                    <span className="ml-2 inline-block rounded-full bg-sky/15 px-2 font-bold text-sky">
                      {listName.get(habit.listId)}
                    </span>
                  )}
                </span>
                {habit.note && (
                  <span className="mt-1 py-[1.5] block text-gray-700 break-words whitespace-pre-line">
                    {habit.note}
                  </span>
                )}
              </span>
              <Link
                href={`/chronicle/${habit.id}/edit?date=${habit.next}&from=tasks${param ? `&list=${param}` : ""}`}
                aria-label={`Edit ${habit.name}`}
                className="shrink-0 rounded-full p-2 text-caption transition hover:bg-sand hover:text-ink"
              >
                <IconPencil className="size-5" stroke={2.25} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
