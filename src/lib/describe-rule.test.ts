import { describe, expect, it } from "vitest";
import { describeRule, formatDate } from "./describe-rule";
import type { RepeatRule } from "./repeat-rule";

const rule = (r: Partial<RepeatRule>) => ({
  startDate: "2026-10-25",
  frequency: "daily" as const,
  endType: "never" as const,
  ...r,
});

describe("describeRule", () => {
  it("one-off", () => {
    expect(describeRule(rule({ frequency: "none" }))).toBe("Once, on 25 Oct 2026");
  });

  it("daily", () => {
    expect(describeRule(rule({}))).toBe("Every day");
  });

  it("weekly lists days in the user's week order", () => {
    const r = rule({ frequency: "weekly", weekdays: [0, 1, 5] });
    expect(describeRule(r, "monday")).toBe("Every Mon, Fri, Sun");
    expect(describeRule(r, "sunday")).toBe("Every Sun, Mon, Fri");
    expect(describeRule(rule({ frequency: "weekly", weekdays: [0, 1, 2, 3, 4, 5, 6] }))).toBe(
      "Every day",
    );
  });

  it("monthly uses ordinals", () => {
    const on = (d: string) => describeRule(rule({ frequency: "monthly", startDate: `2026-10-${d}` }));
    expect(on("01")).toBe("Every month on the 1st");
    expect(on("02")).toBe("Every month on the 2nd");
    expect(on("03")).toBe("Every month on the 3rd");
    expect(on("11")).toBe("Every month on the 11th");
    expect(on("12")).toBe("Every month on the 12th");
    expect(on("22")).toBe("Every month on the 22nd");
    expect(on("31")).toBe("Every month on the 31st");
  });

  it("annually", () => {
    expect(describeRule(rule({ frequency: "annually", startDate: "2028-02-29" }))).toBe(
      "Every year on 29 Feb",
    );
  });

  it("custom: every N periods", () => {
    expect(describeRule(rule({ interval: 3 }))).toBe("Every 3 days");
    expect(describeRule(rule({ frequency: "weekly", weekdays: [4, 1], interval: 2 }))).toBe(
      "Every 2 weeks on Mon, Thu",
    );
    expect(describeRule(rule({ frequency: "monthly", interval: 2 }))).toBe("Every 2 months on the 25th");
    expect(describeRule(rule({ frequency: "annually", interval: 2 }))).toBe("Every 2 years on 25 Oct");
  });

  it("custom: monthly on the nth weekday", () => {
    expect(describeRule(rule({ frequency: "monthly", monthWeek: -1, monthWeekday: 0 }))).toBe(
      "Every month on the last Sunday",
    );
    expect(describeRule(rule({ frequency: "monthly", interval: 3, monthWeek: 2, monthWeekday: 2 }))).toBe(
      "Every 3 months on the 2nd Tuesday",
    );
  });

  it("adds the end condition", () => {
    expect(describeRule(rule({ endType: "on_date", endDate: "2026-12-01" }))).toBe(
      "Every day · until 1 Dec 2026",
    );
    expect(describeRule(rule({ endType: "after_count", endCount: 10 }))).toBe("Every day · 10 times");
    expect(describeRule(rule({ endType: "after_count", endCount: 1 }))).toBe("Every day · once");
  });
});

describe("formatDate", () => {
  it("doesn't shift the day with the machine's time zone", () => {
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});
