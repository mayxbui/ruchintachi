import { describe, expect, it } from "vitest";
import {
  filterParam,
  filterTasks,
  LIST_NAME_MAX,
  nextDateLabel,
  parseTaskFilter,
  validateListName,
} from "./task-lists";

const today = "2026-10-26";
const tasks = [
  { id: "a", next: "2026-10-30", listId: "health" },
  { id: "b", next: "2026-10-26", listId: null },
  { id: "c", next: "2026-11-01", listId: "health" }, // day 7: last day of "Up next"
  { id: "d", next: "2026-11-02", listId: "study" }, // day 8: not yet
];
const ids = (list: { id: string }[]) => list.map((t) => t.id);

describe("filterTasks", () => {
  it("Up next is the coming 7 days, soonest first", () => {
    expect(ids(filterTasks(tasks, { kind: "next" }, today))).toEqual(["b", "a", "c"]);
    // A day later, "d" comes into range (b's next date would have moved on too).
    const later = tasks.filter((t) => t.id !== "b");
    expect(ids(filterTasks(later, { kind: "next" }, "2026-10-27"))).toEqual(["a", "c", "d"]);
  });

  it("All keeps every task in order", () => {
    expect(ids(filterTasks(tasks, { kind: "all" }, today))).toEqual(["a", "b", "c", "d"]);
  });

  it("a list shows only its own tasks", () => {
    expect(ids(filterTasks(tasks, { kind: "list", listId: "health" }, today))).toEqual(["a", "c"]);
    expect(filterTasks(tasks, { kind: "list", listId: "empty" }, today)).toEqual([]);
  });
});

describe("parseTaskFilter", () => {
  it("reads all, one of the user's lists, or falls back to Up next", () => {
    const lists = ["health", "study"];
    expect(parseTaskFilter("all", lists)).toEqual({ kind: "all" });
    expect(parseTaskFilter("study", lists)).toEqual({ kind: "list", listId: "study" });
    expect(parseTaskFilter("someone-elses", lists)).toEqual({ kind: "next" });
    expect(parseTaskFilter(undefined, lists)).toEqual({ kind: "next" });
  });

  it("round-trips through filterParam", () => {
    expect(filterParam({ kind: "next" })).toBeNull();
    expect(filterParam({ kind: "all" })).toBe("all");
    expect(filterParam({ kind: "list", listId: "study" })).toBe("study");
  });
});

describe("validateListName", () => {
  it("trims and squashes spaces", () => {
    expect(validateListName("  Big   goals ")).toEqual({ name: "Big goals" });
  });

  it("rejects empty and too-long names", () => {
    expect(validateListName("   ")).toHaveProperty("error");
    expect(validateListName("x".repeat(LIST_NAME_MAX + 1))).toHaveProperty("error");
    expect(validateListName("x".repeat(LIST_NAME_MAX))).toEqual({ name: "x".repeat(LIST_NAME_MAX) });
  });
});

describe("nextDateLabel", () => {
  it("says Today, Tomorrow, or the date", () => {
    expect(nextDateLabel("2026-10-26", today)).toBe("Today");
    expect(nextDateLabel("2026-10-27", today)).toBe("Tomorrow");
    expect(nextDateLabel("2026-10-30", today)).toBe("Fri 30 Oct");
  });
});
