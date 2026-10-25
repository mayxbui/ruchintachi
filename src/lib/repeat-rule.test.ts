import { describe, expect, it } from "vitest";
import {
  expandOccurrences,
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
