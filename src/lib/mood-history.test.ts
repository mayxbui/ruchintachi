import { describe, expect, it } from "vitest";
import {
  hasMoodHistory,
  moodRangeStart,
  moodSeries,
  parseMoodRange,
  shortDate,
} from "./mood-history";

describe("parseMoodRange", () => {
  it("accepts the three ranges and falls back to Month", () => {
    expect(parseMoodRange("week")).toBe("week");
    expect(parseMoodRange("month")).toBe("month");
    expect(parseMoodRange("quarter")).toBe("quarter");
    expect(parseMoodRange(undefined)).toBe("month");
    expect(parseMoodRange("year")).toBe("month");
    expect(parseMoodRange("toString")).toBe("month");
  });
});

describe("moodRangeStart", () => {
  it("counts today as the range's last day", () => {
    expect(moodRangeStart("2026-10-29", "week")).toBe("2026-10-23");
    expect(moodRangeStart("2026-10-29", "month")).toBe("2026-09-30");
    expect(moodRangeStart("2026-10-29", "quarter")).toBe("2026-08-01");
  });
});

describe("moodSeries", () => {
  it("has one point per day, with today's live mood last", () => {
    const saved = [
      { date: "2026-10-27", mood: 54 },
      { date: "2026-10-28", mood: 50 },
    ];
    expect(moodSeries(saved, "2026-10-26", "2026-10-29", 58)).toEqual([
      { date: "2026-10-26", mood: null, today: false },
      { date: "2026-10-27", mood: 54, today: false },
      { date: "2026-10-28", mood: 50, today: false },
      { date: "2026-10-29", mood: 58, today: true },
    ]);
  });

  it("uses the live mood for today even if today was saved", () => {
    const series = moodSeries([{ date: "2026-10-29", mood: 40 }], "2026-10-29", "2026-10-29", 60);
    expect(series).toEqual([{ date: "2026-10-29", mood: 60, today: true }]);
  });
});

describe("hasMoodHistory", () => {
  it("needs at least two days with a mood", () => {
    expect(hasMoodHistory(moodSeries([], "2026-10-27", "2026-10-29", 50))).toBe(false);
    expect(hasMoodHistory(moodSeries([{ date: "2026-10-28", mood: 50 }], "2026-10-27", "2026-10-29", 50))).toBe(true);
  });
});

describe("shortDate", () => {
  it("formats as day and short month", () => {
    expect(shortDate("2026-10-28")).toBe("28 Oct");
    expect(shortDate("2026-01-05")).toBe("5 Jan");
  });
});
