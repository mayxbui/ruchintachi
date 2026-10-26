import { describe, expect, it } from "vitest";
import {
  expandOccurrences,
  firstOccurrenceFrom,
  nthWeekdayOfMonth,
  occurrenceOn,
  type HabitException,
  type RepeatRule,
} from "./repeat-rule";

const base: RepeatRule = {
  name: "Drink water",
  startDate: "2026-10-25", // a Sunday
  frequency: "daily",
  endType: "never",
};

const dates = (rule: RepeatRule, from: string, to: string, ex: HabitException[] = []) =>
  expandOccurrences(rule, from, to, ex).map((o) => o.date);

describe("none", () => {
  it("occurs once, on the start date", () => {
    const rule = { ...base, frequency: "none" as const };
    expect(dates(rule, "2026-01-01", "2027-12-31")).toEqual(["2026-10-25"]);
    expect(dates(rule, "2026-10-26", "2027-12-31")).toEqual([]);
  });
});

describe("daily", () => {
  it("returns every day in the range, never before the start", () => {
    expect(dates(base, "2026-10-23", "2026-10-27")).toEqual([
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });

  it("returns nothing for an empty or inverted range", () => {
    expect(dates(base, "2026-10-28", "2026-10-27")).toEqual([]);
    expect(dates(base, "2026-01-01", "2026-10-24")).toEqual([]);
  });
});

describe("weekly", () => {
  it("hits only the chosen weekdays", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: [1, 3, 5] };
    expect(dates(rule, "2026-10-25", "2026-11-01")).toEqual([
      "2026-10-26", // Mon
      "2026-10-28", // Wed
      "2026-10-30", // Fri
    ]);
  });

  it("skips the start date when it isn't a chosen weekday", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: [6] };
    expect(dates(rule, "2026-10-25", "2026-11-08")[0]).toBe("2026-10-31");
  });

  it("defaults to the start date's weekday", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: null };
    expect(dates(rule, "2026-10-25", "2026-11-08")).toEqual([
      "2026-10-25",
      "2026-11-01",
      "2026-11-08",
    ]);
  });
});

describe("monthly", () => {
  it("on the 31st skips months without one", () => {
    const rule = { ...base, frequency: "monthly" as const, startDate: "2027-01-31" };
    expect(dates(rule, "2027-01-01", "2027-08-31")).toEqual([
      "2027-01-31",
      "2027-03-31",
      "2027-05-31",
      "2027-07-31",
      "2027-08-31",
    ]);
  });

  it("on the 29th skips February outside leap years", () => {
    const rule = { ...base, frequency: "monthly" as const, startDate: "2027-01-29" };
    expect(dates(rule, "2027-01-01", "2027-03-31")).toEqual(["2027-01-29", "2027-03-29"]);
    const leap = { ...rule, startDate: "2028-01-29" };
    expect(dates(leap, "2028-01-01", "2028-03-31")).toEqual([
      "2028-01-29",
      "2028-02-29",
      "2028-03-29",
    ]);
  });

  it("crosses the year boundary", () => {
    const rule = { ...base, frequency: "monthly" as const, startDate: "2026-11-15" };
    expect(dates(rule, "2026-11-01", "2027-02-28")).toEqual([
      "2026-11-15",
      "2026-12-15",
      "2027-01-15",
      "2027-02-15",
    ]);
  });
});

describe("annually", () => {
  it("on Feb 29 only hits leap years", () => {
    const rule = { ...base, frequency: "annually" as const, startDate: "2028-02-29" };
    expect(dates(rule, "2028-01-01", "2036-12-31")).toEqual([
      "2028-02-29",
      "2032-02-29",
      "2036-02-29",
    ]);
  });

  it("repeats on the same month and day", () => {
    const rule = { ...base, frequency: "annually" as const };
    expect(dates(rule, "2026-01-01", "2028-12-31")).toEqual([
      "2026-10-25",
      "2027-10-25",
      "2028-10-25",
    ]);
  });
});

describe("end conditions", () => {
  it("on date is inclusive", () => {
    const rule = { ...base, endType: "on_date" as const, endDate: "2026-10-27" };
    expect(dates(rule, "2026-10-01", "2026-12-31")).toEqual([
      "2026-10-25",
      "2026-10-26",
      "2026-10-27",
    ]);
  });

  it("after N counts from the start, not from the range", () => {
    const rule = { ...base, endType: "after_count" as const, endCount: 5 };
    expect(dates(rule, "2026-10-28", "2026-12-31")).toEqual([
      "2026-10-28",
      "2026-10-29",
    ]);
  });

  it("after N counts skipped instances that don't fit (monthly 31st)", () => {
    const rule = {
      ...base,
      frequency: "monthly" as const,
      startDate: "2027-01-31",
      endType: "after_count" as const,
      endCount: 3,
    };
    expect(dates(rule, "2027-01-01", "2027-12-31")).toEqual([
      "2027-01-31",
      "2027-03-31",
      "2027-05-31",
    ]);
  });

  it("rejects incomplete end conditions", () => {
    expect(() => dates({ ...base, endType: "on_date" }, "2026-10-25", "2026-10-25")).toThrow();
    expect(() =>
      dates({ ...base, endType: "after_count", endCount: 0 }, "2026-10-25", "2026-10-25"),
    ).toThrow();
  });
});

describe("exceptions", () => {
  it("skips a day without changing the rest of the series", () => {
    const ex = [{ date: "2026-10-26", overrideName: null }];
    expect(dates(base, "2026-10-25", "2026-10-27", ex)).toEqual([
      "2026-10-25",
      "2026-10-27",
    ]);
  });

  it("a skipped day still uses up an after-N count", () => {
    const rule = { ...base, endType: "after_count" as const, endCount: 3 };
    const ex = [{ date: "2026-10-26", overrideName: null }];
    expect(dates(rule, "2026-10-01", "2026-12-31", ex)).toEqual([
      "2026-10-25",
      "2026-10-27",
    ]);
  });

  it("renames a single day", () => {
    const ex = [{ date: "2026-10-26", overrideName: "Drink tea" }];
    expect(expandOccurrences(base, "2026-10-25", "2026-10-27", ex)).toEqual([
      { date: "2026-10-25", name: "Drink water" },
      { date: "2026-10-26", name: "Drink tea" },
      { date: "2026-10-27", name: "Drink water" },
    ]);
  });

  it("ignores exceptions on days that aren't scheduled", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: [0] };
    const ex = [{ date: "2026-10-26", overrideName: "Extra" }];
    expect(dates(rule, "2026-10-25", "2026-11-01", ex)).toEqual([
      "2026-10-25",
      "2026-11-01",
    ]);
  });
});

describe("occurrenceOn", () => {
  it("returns the occurrence or null", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: [1] };
    expect(occurrenceOn(rule, "2026-10-26")).toEqual({ date: "2026-10-26", name: "Drink water" });
    expect(occurrenceOn(rule, "2026-10-27")).toBeNull();
  });
});

describe("intervals", () => {
  it("every 3 days", () => {
    const rule = { ...base, interval: 3 };
    expect(dates(rule, "2026-10-25", "2026-11-05")).toEqual([
      "2026-10-25",
      "2026-10-28",
      "2026-10-31",
      "2026-11-03",
    ]);
  });

  it("every 2 weeks on Mon and Thu, counting weeks from the start's Monday", () => {
    // Starts Wed 28 Oct: that week's Thu counts, the next week is skipped.
    const rule = { ...base, startDate: "2026-10-28", frequency: "weekly" as const, weekdays: [1, 4], interval: 2 };
    expect(dates(rule, "2026-10-01", "2026-11-30")).toEqual([
      "2026-10-29",
      "2026-11-09",
      "2026-11-12",
      "2026-11-23",
      "2026-11-26",
    ]);
  });

  it("every 2 weeks on a Sunday start (the week runs Mon–Sun)", () => {
    const rule = { ...base, frequency: "weekly" as const, weekdays: [0], interval: 2 }; // Sun 25 Oct
    expect(dates(rule, "2026-10-25", "2026-11-30")).toEqual(["2026-10-25", "2026-11-08", "2026-11-22"]);
  });

  it("every 2 months on the 31st skips the months without one", () => {
    const rule = { ...base, startDate: "2026-01-31", frequency: "monthly" as const, interval: 2 };
    // Jan, Mar, May, Jul, Sep, Nov: all have a 31st except Sep and Nov.
    expect(dates(rule, "2026-01-01", "2026-12-31")).toEqual([
      "2026-01-31",
      "2026-03-31",
      "2026-05-31",
      "2026-07-31",
    ]);
  });

  it("every 3 months across a year end", () => {
    const rule = { ...base, startDate: "2026-11-14", frequency: "monthly" as const, interval: 3 };
    expect(dates(rule, "2026-01-01", "2027-12-31")).toEqual([
      "2026-11-14",
      "2027-02-14",
      "2027-05-14",
      "2027-08-14",
      "2027-11-14",
    ]);
  });

  it("every 2 years on Feb 29 only lands on leap years", () => {
    const rule = { ...base, startDate: "2024-02-29", frequency: "annually" as const, interval: 2 };
    expect(dates(rule, "2024-01-01", "2033-12-31")).toEqual(["2024-02-29", "2028-02-29", "2032-02-29"]);
  });

  it("after N counts every instance, skipped invalid dates excluded (RRULE)", () => {
    const rule = { ...base, interval: 2, endType: "after_count" as const, endCount: 3 };
    expect(dates(rule, "2026-10-01", "2026-12-31")).toEqual(["2026-10-25", "2026-10-27", "2026-10-29"]);
  });
});

describe("monthly on the nth weekday", () => {
  it("finds the 1st–4th and last weekday", () => {
    // Nov 2026 starts on a Sunday and has 5 Sundays and 4 Saturdays.
    expect(nthWeekdayOfMonth(2026, 11, 1, 0)).toBe(1);
    expect(nthWeekdayOfMonth(2026, 11, 4, 0)).toBe(22);
    expect(nthWeekdayOfMonth(2026, 11, -1, 0)).toBe(29); // a 5th Sunday is the last
    expect(nthWeekdayOfMonth(2026, 11, -1, 6)).toBe(28);
    expect(nthWeekdayOfMonth(2028, 2, -1, 2)).toBe(29); // leap-year February
  });

  it("monthly on the last Sunday", () => {
    const rule = { ...base, frequency: "monthly" as const, monthWeek: -1, monthWeekday: 0 }; // starts 25 Oct
    expect(dates(rule, "2026-10-01", "2027-01-31")).toEqual([
      "2026-10-25",
      "2026-11-29",
      "2026-12-27",
      "2027-01-31",
    ]);
  });

  it("skips the start month when its day has passed, and doesn't count it", () => {
    // 2nd Tuesday of Oct 2026 is the 13th, before the 25 Oct start.
    const rule = {
      ...base,
      frequency: "monthly" as const,
      monthWeek: 2,
      monthWeekday: 2,
      endType: "after_count" as const,
      endCount: 2,
    };
    expect(dates(rule, "2026-10-01", "2027-12-31")).toEqual(["2026-11-10", "2026-12-08"]);
  });

  it("every 2 months on the 1st Monday", () => {
    const rule = { ...base, startDate: "2026-01-05", frequency: "monthly" as const, interval: 2, monthWeek: 1, monthWeekday: 1 };
    expect(dates(rule, "2026-01-01", "2026-07-31")).toEqual(["2026-01-05", "2026-03-02", "2026-05-04", "2026-07-06"]);
  });
});

describe("firstOccurrenceFrom", () => {
  it("finds a day years away", () => {
    const rule = { ...base, frequency: "annually" as const, interval: 5 };
    expect(firstOccurrenceFrom(rule, "2026-10-26")?.date).toBe("2031-10-25");
  });

  it("skips skipped days and stops at the end", () => {
    const rule = { ...base, endType: "on_date" as const, endDate: "2026-10-26" };
    expect(firstOccurrenceFrom(rule, "2026-10-25", [{ date: "2026-10-25", overrideName: null }])?.date).toBe(
      "2026-10-26",
    );
    expect(firstOccurrenceFrom(rule, "2026-10-27")).toBeNull();
  });

  it("reaches far-off days but stops after year 9999", () => {
    const leap = { ...base, startDate: "2024-02-29", frequency: "annually" as const, interval: 400 };
    expect(firstOccurrenceFrom(leap, "2025-01-01")?.date).toBe("2424-02-29");
    expect(firstOccurrenceFrom({ ...leap, startDate: "9600-02-29" }, "9601-01-01")).toBeNull();
  });
});
