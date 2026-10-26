import { describe, expect, it } from "vitest";
import {
  isEditableDay,
  nextOccurrence,
  planFutureDelete,
  planFutureEdit,
  remainingCount,
  sameSeries,
  seriesFrom,
} from "./habit-edit";
import type { RepeatRule } from "./repeat-rule";

// 2026-10-26 is a Monday.
const daily: RepeatRule = {
  name: "Water",
  startDate: "2026-10-20",
  frequency: "daily",
  endType: "never",
};
const mondays: RepeatRule = { ...daily, frequency: "weekly", weekdays: [1] };

describe("nextOccurrence", () => {
  it("finds the first scheduled day on or after a date", () => {
    expect(nextOccurrence(mondays, [], "2026-10-27")).toBe("2026-11-02");
    expect(nextOccurrence(mondays, [], "2026-10-26")).toBe("2026-10-26");
  });

  it("skips skipped days and reaches the next Feb 29", () => {
    expect(
      nextOccurrence(mondays, [{ date: "2026-10-26", overrideName: null }], "2026-10-26"),
    ).toBe("2026-11-02");
    const leap = { ...daily, frequency: "annually" as const, startDate: "2024-02-29" };
    expect(nextOccurrence(leap, [], "2026-10-26")).toBe("2028-02-29");
  });

  it("returns null once the series is over", () => {
    const ended = { ...daily, endType: "on_date" as const, endDate: "2026-10-22" };
    expect(nextOccurrence(ended, [], "2026-10-26")).toBeNull();
  });
});

describe("isEditableDay", () => {
  it("only scheduled days from today on", () => {
    expect(isEditableDay(mondays, [], "2026-10-26", "2026-10-26")).toBe(true);
    expect(isEditableDay(mondays, [], "2026-11-02", "2026-10-26")).toBe(true);
    expect(isEditableDay(mondays, [], "2026-10-27", "2026-10-26")).toBe(false); // not a Monday
    expect(isEditableDay(mondays, [], "2026-10-19", "2026-10-26")).toBe(false); // past
    expect(
      isEditableDay(mondays, [{ date: "2026-11-02", overrideName: null }], "2026-11-02", "2026-10-26"),
    ).toBe(false); // skipped
  });
});

describe("remainingCount", () => {
  const tenTimes = { ...daily, endType: "after_count" as const, endCount: 10 };

  it("subtracts the instances before the date", () => {
    expect(remainingCount(tenTimes, "2026-10-20")).toBe(10);
    expect(remainingCount(tenTimes, "2026-10-26")).toBe(4); // 20th–25th used 6
    expect(remainingCount(tenTimes, "2026-11-30")).toBe(0);
  });

  it("is null for other end types", () => {
    expect(remainingCount(daily, "2026-10-26")).toBeNull();
  });
});

describe("planFutureEdit / planFutureDelete", () => {
  it("changes in place when there are no earlier days", () => {
    expect(planFutureEdit(daily, "2026-10-20")).toEqual({ kind: "replace" });
    expect(planFutureDelete(daily, "2026-10-20")).toEqual({ kind: "delete" });
  });

  it("otherwise ends the old series the day before", () => {
    expect(planFutureEdit(daily, "2026-10-26")).toEqual({ kind: "split", oldEndDate: "2026-10-25" });
    expect(planFutureDelete(daily, "2026-11-01")).toEqual({ kind: "end", endDate: "2026-10-31" });
  });
});

describe("seriesFrom", () => {
  it("starts a repeating series on the day, with what's left of a count", () => {
    const counted = { ...daily, endType: "after_count" as const, endCount: 10 };
    expect(seriesFrom(counted, "2026-10-23")).toEqual({
      ...counted,
      startDate: "2026-10-23",
      endCount: 7,
    });
    expect(seriesFrom(daily, "2026-10-23")).toMatchObject({ startDate: "2026-10-23" });
  });

  it("leaves a one-off as it is", () => {
    const once = { ...daily, frequency: "none" as const };
    expect(seriesFrom(once, "2026-10-20")).toBe(once);
  });
});

describe("sameSeries", () => {
  const habit = { ...mondays, name: "Run", icon: null, note: null, weekdays: [1, 3] };
  it("ignores missing-vs-null and compares weekdays by value", () => {
    expect(sameSeries({ ...habit, weekdays: [1, 3] }, { ...habit, weekdays: [1, 3] })).toBe(true);
    expect(sameSeries({ ...daily, weekdays: null }, { ...daily })).toBe(true);
  });

  it("spots any changed field", () => {
    expect(sameSeries(habit, { ...habit, weekdays: [1] })).toBe(false);
    expect(sameSeries(habit, { ...habit, note: "Early" })).toBe(false);
    expect(sameSeries(habit, { ...habit, endCount: 3 })).toBe(false);
  });
});
