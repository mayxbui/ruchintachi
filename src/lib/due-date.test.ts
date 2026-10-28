import { describe, expect, it } from "vitest";
import { carriesOver, dueLabel, scheduleAll, scheduled } from "./due-date";
import { occurrenceOn } from "./repeat-rule";

const today = "2026-10-28";
const task = {
  id: "t",
  name: "Post the parcel",
  frequency: "none" as const,
  startDate: "2026-10-25",
  endType: "never" as const,
  dueDate: "2026-10-27",
};

describe("carriesOver", () => {
  it("is only for one-off tasks with a due date", () => {
    expect(carriesOver(task)).toBe(true);
    expect(carriesOver({ ...task, dueDate: null })).toBe(false);
    expect(carriesOver({ ...task, frequency: "daily" })).toBe(false);
  });
});

describe("scheduled", () => {
  it("puts an undone task on today, even when overdue", () => {
    const s = scheduled(task, today, undefined);
    expect(s.startDate).toBe(today);
    expect(occurrenceOn(s, today)).not.toBeNull();
    // Earlier days are never filled in.
    expect(occurrenceOn(s, "2026-10-26")).toBeNull();
  });

  it("waits for a start date that's still ahead", () => {
    const later = { ...task, startDate: "2026-11-02", dueDate: "2026-11-05" };
    expect(scheduled(later, today, undefined)).toBe(later);
  });

  it("sits on the day it was ticked, and is gone after", () => {
    const s = scheduled(task, today, "2026-10-26");
    expect(s.startDate).toBe("2026-10-26");
    expect(occurrenceOn(s, today)).toBeNull();
  });

  it("leaves other habits as they are", () => {
    const once = { ...task, dueDate: null };
    const daily = { ...task, frequency: "daily" as const, dueDate: null };
    expect(scheduled(once, today, undefined)).toBe(once);
    expect(scheduled(daily, today, undefined)).toBe(daily);
  });

  it("scheduleAll looks up each task's tick", () => {
    const other = { ...task, id: "u" };
    const [a, b] = scheduleAll([task, other], today, new Map([["u", "2026-10-25"]]));
    expect([a.startDate, b.startDate]).toEqual([today, "2026-10-25"]);
  });
});

describe("dueLabel", () => {
  it("names the day, and counts days overdue", () => {
    expect(dueLabel(today, today)).toEqual({ text: "Due today", overdue: false });
    expect(dueLabel("2026-10-29", today)).toEqual({ text: "Due tomorrow", overdue: false });
    expect(dueLabel("2026-10-30", today)).toEqual({ text: "Due Fri 30 Oct", overdue: false });
    expect(dueLabel("2026-10-27", today)).toEqual({ text: "Overdue 1 day", overdue: true });
    expect(dueLabel("2026-10-20", today)).toEqual({ text: "Overdue 8 days", overdue: true });
  });
});
