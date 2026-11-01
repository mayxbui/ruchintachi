import { describe, expect, it } from "vitest";
import { currentStreak, dayType, isCompleteDay, streakEndingAt, todayPercent, type DayType } from "./streak";

const habit = (done: boolean) => ({ repeats: true, done });
const oneOff = (done: boolean) => ({ repeats: false, done });

/** Day types from a map; days not listed are empty. */
const days = (types: Record<string, DayType>) => (date: string) => types[date] ?? "empty";

describe("isCompleteDay", () => {
  it("needs at least one repeating habit, all done", () => {
    expect(isCompleteDay([])).toBe(false);
    expect(isCompleteDay([oneOff(true)])).toBe(false);
    expect(isCompleteDay([habit(true), habit(true)])).toBe(true);
    expect(isCompleteDay([habit(true), habit(false)])).toBe(false);
  });

  it("ignores one-off tasks either way", () => {
    expect(isCompleteDay([habit(true), oneOff(false)])).toBe(true);
    expect(isCompleteDay([habit(false), oneOff(true)])).toBe(false);
  });
});

describe("dayType", () => {
  it("sorts days into complete, missed and empty", () => {
    expect(dayType([habit(true), oneOff(false)])).toBe("complete");
    expect(dayType([habit(true), habit(false)])).toBe("missed");
    expect(dayType([])).toBe("empty");
    expect(dayType([oneOff(false), oneOff(true)])).toBe("empty");
  });

  it("counts a repaired day as empty", () => {
    expect(dayType([habit(false)], true)).toBe("empty");
  });
});

describe("streakEndingAt", () => {
  it("counts complete days back to the first miss", () => {
    const typeOf = days({
      "2026-11-01": "missed",
      "2026-11-02": "complete",
      "2026-11-03": "complete",
      "2026-11-04": "complete",
    });
    expect(streakEndingAt("2026-11-04", typeOf, "2026-10-01")).toBe(3);
    expect(streakEndingAt("2026-11-01", typeOf, "2026-10-01")).toBe(0);
  });

  it("skips empty days without breaking or extending it", () => {
    const typeOf = days({ "2026-11-01": "complete", "2026-11-03": "complete" });
    expect(streakEndingAt("2026-11-05", typeOf, "2026-10-01")).toBe(2);
  });

  it("stops at the earliest day", () => {
    const typeOf = () => "complete" as const;
    expect(streakEndingAt("2026-11-05", typeOf, "2026-11-03")).toBe(3);
    expect(streakEndingAt("2026-11-05", typeOf, "2026-11-06")).toBe(0);
  });
});

describe("currentStreak", () => {
  const history = { "2026-11-02": "complete", "2026-11-03": "complete" } as const;

  it("ends today once today is complete", () => {
    expect(currentStreak("2026-11-04", days({ ...history, "2026-11-04": "complete" }), "2026-11-01")).toBe(3);
  });

  it("ends yesterday while today is unfinished", () => {
    expect(currentStreak("2026-11-04", days({ ...history, "2026-11-04": "missed" }), "2026-11-01")).toBe(2);
    expect(currentStreak("2026-11-04", days(history), "2026-11-01")).toBe(2);
  });

  it("is 0 after a missed yesterday", () => {
    expect(currentStreak("2026-11-05", days({ ...history, "2026-11-04": "missed" }), "2026-11-01")).toBe(0);
  });
});

describe("todayPercent", () => {
  it("is null with no tasks, not 0 or 100", () => {
    expect(todayPercent([])).toBeNull();
  });

  it("rounds done over scheduled", () => {
    expect(todayPercent([{ done: true }, { done: false }, { done: false }])).toBe(33);
    expect(todayPercent([{ done: true }])).toBe(100);
    expect(todayPercent([{ done: false }])).toBe(0);
  });
});
