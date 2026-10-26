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
import { sortHabits } from "@/lib/sort-habits";
import {
  filterParam,
  filterTasks,
  nextDateLabel,
  parseTaskFilter,
  UP_NEXT_DAYS,
  type TaskFilter,
} from "@/lib/task-lists";
import { SortMenu } from "../../sort-menu";
import { ListMenu, NewList } from "./list-controls";
import { TaskRows } from "./task-rows";

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
  const shown = filterTasks(sortHabits(current, user.taskSort), filter, today);
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

      {activeList && (
        <ListMenu
          key={activeList.id}
          listId={activeList.id}
          name={activeList.name}
          taskCount={shown.length}
        />
      )}

      <div className="mb-3 flex justify-end">
        <SortMenu sort={user.taskSort} doneLast={user.doneLast} />
      </div>

      {shown.length === 0 ? (
        <p className="text-caption">{empty}</p>
      ) : (
        <TaskRows
          // Remount on a new filter or sort, so a drag never mixes views.
          key={`${param ?? "next"}-${user.taskSort}`}
          reorderable={user.taskSort === "custom"}
          rows={shown.map((habit) => ({
            id: habit.id,
            name: habit.name,
            note: habit.note,
            emoji: iconEmoji(habit.icon) ?? "•",
            subtitle:
              filter.kind === "next" ? nextDateLabel(habit.next, today) : describeRule(habit, user.weekStart),
            listTag: habit.listId && !activeList ? (listName.get(habit.listId) ?? null) : null,
            editHref: `/chronicle/${habit.id}/edit?date=${habit.next}&from=tasks${param ? `&list=${param}` : ""}`,
          }))}
        />
      )}
    </section>
  );
}
