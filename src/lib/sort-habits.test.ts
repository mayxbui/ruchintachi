import { describe, expect, it } from "vitest";
import { doneLast, placeInSlots, sortHabits, type SortableHabit } from "./sort-habits";

const at = (day: number) => new Date(Date.UTC(2026, 9, day));
const habit = (name: string, extra: Partial<SortableHabit> = {}): SortableHabit & { id: string } => ({
  id: name,
  name,
  frequency: "daily",
  createdAt: at(1),
  position: 0,
  next: "2026-10-26",
  ...extra,
});

const run = habit("run", { next: "2026-10-28", frequency: "weekly", createdAt: at(3), position: 2 });
const apple = habit("Apple", { next: "2026-10-27", frequency: "none", createdAt: at(5), position: 0 });
const banana = habit("banana", { next: null, frequency: "monthly", createdAt: at(2), position: 1 });
const zinc = habit("Zinc", { next: "2026-10-27", frequency: "daily", createdAt: at(4), position: 3 });
const all = [run, apple, banana, zinc];
const names = (list: { name: string }[]) => list.map((h) => h.name);

describe("sortHabits", () => {
  it("Next due: soonest first, ties by name, finished last", () => {
    expect(names(sortHabits(all, "next"))).toEqual(["Apple", "Zinc", "run", "banana"]);
  });

  it("Due date: tasks with one first, most overdue on top, the rest by name", () => {
    const list = [
      habit("No due"),
      habit("Friday", { frequency: "none", dueDate: "2026-10-30" }),
      habit("Late", { frequency: "none", dueDate: "2026-10-20" }),
      habit("Also none", { dueDate: null }),
    ];
    expect(names(sortHabits(list, "due"))).toEqual(["Late", "Friday", "Also none", "No due"]);
  });

  it("names sort case-insensitively both ways", () => {
    expect(names(sortHabits(all, "name-asc"))).toEqual(["Apple", "banana", "run", "Zinc"]);
    expect(names(sortHabits(all, "name-desc"))).toEqual(["Zinc", "run", "banana", "Apple"]);
  });

  it("numbers inside names sort naturally", () => {
    const list = [habit("Step 10"), habit("Step 2")];
    expect(names(sortHabits(list, "name-asc"))).toEqual(["Step 2", "Step 10"]);
  });

  it("Newest / Oldest by created date", () => {
    expect(names(sortHabits(all, "newest"))).toEqual(["Apple", "Zinc", "run", "banana"]);
    expect(names(sortHabits(all, "oldest"))).toEqual(["banana", "run", "Zinc", "Apple"]);
  });

  it("Repeat groups once → daily → weekly → monthly, A–Z inside", () => {
    const daily2 = habit("Abs", { frequency: "daily" });
    expect(names(sortHabits([...all, daily2], "repeat"))).toEqual([
      "Apple",
      "Abs",
      "Zinc",
      "run",
      "banana",
    ]);
  });

  it("Custom follows position; equal positions keep created order", () => {
    expect(names(sortHabits(all, "custom"))).toEqual(["Apple", "banana", "run", "Zinc"]);
    const old = habit("b-old", { createdAt: at(1) });
    const fresh = habit("a-new", { createdAt: at(9) });
    expect(names(sortHabits([fresh, old], "custom"))).toEqual(["b-old", "a-new"]);
  });

  it("doesn't change the input", () => {
    const copy = [...all];
    sortHabits(all, "name-asc");
    expect(all).toEqual(copy);
  });
});

describe("doneLast", () => {
  it("moves done items down, keeping each group's order", () => {
    const items = [
      { id: "a", done: true },
      { id: "b", done: false },
      { id: "c", done: true },
      { id: "d", done: false },
    ];
    expect(doneLast(items).map((i) => i.id)).toEqual(["b", "d", "a", "c"]);
  });
});

describe("placeInSlots", () => {
  it("reorders a subset in the subset's own slots", () => {
    // Reordering list items b, d (shown as d, b) leaves a, c, e where they were.
    expect(placeInSlots(["a", "b", "c", "d", "e"], ["d", "b"])).toEqual(["a", "d", "c", "b", "e"]);
    expect(placeInSlots(["a", "b", "c"], ["c", "b", "a"])).toEqual(["c", "b", "a"]);
  });

  it("rejects unknown or repeated ids", () => {
    expect(placeInSlots(["a", "b"], ["a", "x"])).toBeNull();
    expect(placeInSlots(["a", "b"], ["a", "a"])).toBeNull();
  });
});
