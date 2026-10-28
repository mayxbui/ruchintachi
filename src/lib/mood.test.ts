import { describe, expect, it } from "vitest";
import {
  clampMood,
  dayMoodChange,
  isPerfectWeek,
  isWeekEnd,
  moodLevel,
  replayMood,
  type DayHabits,
} from "./mood";

const habit = (done: boolean) => ({ repeats: true, done });
const oneOff = (done: boolean) => ({ repeats: false, done });

describe("moodLevel", () => {
  it("maps each band to its mood", () => {
    expect(moodLevel(100)).toBe("lovestruck");
    expect(moodLevel(85)).toBe("lovestruck");
    expect(moodLevel(84)).toBe("overjoyed");
    expect(moodLevel(65)).toBe("overjoyed");
    expect(moodLevel(64)).toBe("content");
    expect(moodLevel(50)).toBe("content");
    expect(moodLevel(40)).toBe("content");
    expect(moodLevel(39)).toBe("gloomy");
    expect(moodLevel(20)).toBe("gloomy");
    expect(moodLevel(19)).toBe("fuming");
    expect(moodLevel(0)).toBe("fuming");
  });

  it("clamps scores outside 0–100", () => {
    expect(moodLevel(150)).toBe("lovestruck");
    expect(moodLevel(-20)).toBe("fuming");
    expect(clampMood(-3)).toBe(0);
    expect(clampMood(103)).toBe(100);
  });
});

describe("dayMoodChange", () => {
  it("lifts the mood when every habit is done", () => {
    expect(dayMoodChange([habit(true), habit(true)], true)).toBe(8);
    expect(dayMoodChange([habit(true)], false)).toBe(8);
  });

  it("costs 4 per missed habit, at most 12, once the day is over", () => {
    expect(dayMoodChange([habit(true), habit(false)], true)).toBe(-4);
    expect(dayMoodChange([habit(false), habit(false)], true)).toBe(-8);
    expect(dayMoodChange([habit(false), habit(false), habit(false), habit(false)], true)).toBe(-12);
  });

  it("never drops during the day", () => {
    expect(dayMoodChange([habit(false)], false)).toBe(0);
    expect(dayMoodChange([habit(true), habit(false)], false)).toBe(0);
  });

  it("leaves days with no habits alone and ignores one-off tasks", () => {
    expect(dayMoodChange([], true)).toBe(0);
    expect(dayMoodChange([oneOff(false)], true)).toBe(0);
    expect(dayMoodChange([oneOff(true)], true)).toBe(0);
    expect(dayMoodChange([habit(true), oneOff(false)], true)).toBe(8);
    expect(dayMoodChange([habit(false), oneOff(true)], true)).toBe(-4);
  });
});

describe("isPerfectWeek", () => {
  it("needs every habit in the week done, ignoring empty days", () => {
    expect(isPerfectWeek([[habit(true)], [], [habit(true), oneOff(false)]])).toBe(true);
    expect(isPerfectWeek([[habit(true)], [habit(false)]])).toBe(false);
  });

  it("isn't perfect without any habits", () => {
    expect(isPerfectWeek([[], [], []])).toBe(false);
    expect(isPerfectWeek([[oneOff(true)]])).toBe(false);
  });
});

describe("isWeekEnd", () => {
  it("follows the week start setting", () => {
    // 2026-11-01 is a Sunday.
    expect(isWeekEnd("2026-11-01", "monday")).toBe(true);
    expect(isWeekEnd("2026-11-01", "sunday")).toBe(false);
    expect(isWeekEnd("2026-10-31", "sunday")).toBe(true);
  });
});

describe("replayMood", () => {
  const days = (map: Record<string, DayHabits>) => (date: string) => map[date] ?? [];

  it("adds up day by day from the start", () => {
    const itemsFor = days({
      "2026-10-26": [habit(true)],
      "2026-10-27": [habit(true)],
      "2026-10-28": [habit(false), habit(false)],
      "2026-10-29": [],
    });
    expect(replayMood(50, ["2026-10-26", "2026-10-27", "2026-10-28", "2026-10-29"], itemsFor, "monday")).toEqual([
      { date: "2026-10-26", mood: 58 },
      { date: "2026-10-27", mood: 66 },
      { date: "2026-10-28", mood: 58 },
      { date: "2026-10-29", mood: 58 },
    ]);
  });

  it("adds the perfect-week bonus on the week's last day", () => {
    // Mon 2026-10-26 .. Sun 2026-11-01, one habit on Mon and Sun.
    const itemsFor = days({ "2026-10-26": [habit(true)], "2026-11-01": [habit(true)] });
    const result = replayMood(50, ["2026-10-31", "2026-11-01"], itemsFor, "monday");
    // Monday was before the replay began but still counts toward the week.
    expect(result).toEqual([
      { date: "2026-10-31", mood: 50 },
      { date: "2026-11-01", mood: 50 + 8 + 12 },
    ]);
  });

  it("gives no bonus when a habit in the week was missed", () => {
    const itemsFor = days({ "2026-10-26": [habit(false)], "2026-11-01": [habit(true)] });
    expect(replayMood(50, ["2026-11-01"], itemsFor, "monday")).toEqual([{ date: "2026-11-01", mood: 58 }]);
  });

  it("stays within 0–100", () => {
    const good = days({ "2026-10-26": [habit(true)], "2026-10-27": [habit(true)] });
    expect(replayMood(95, ["2026-10-26", "2026-10-27"], good, "monday").map((d) => d.mood)).toEqual([100, 100]);
    const bad = days({ "2026-10-26": [habit(false), habit(false), habit(false)] });
    expect(replayMood(5, ["2026-10-26"], bad, "monday")).toEqual([{ date: "2026-10-26", mood: 0 }]);
  });
});
