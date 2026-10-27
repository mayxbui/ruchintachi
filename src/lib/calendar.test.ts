import { describe, expect, it } from "vitest";
import { addMonths, formatMonth, monthGrid, parseMonth, weekdayLabels } from "./calendar";

describe("parseMonth", () => {
  it("keeps a valid month", () => {
    expect(parseMonth("2026-02", "2026-10-27")).toBe("2026-02");
  });

  it("falls back to today's month for anything else", () => {
    for (const raw of [undefined, "", "2026-13", "2026-00", "2026-1", "1999-05", "abc", "2026-10-01"]) {
      expect(parseMonth(raw, "2026-10-27"), String(raw)).toBe("2026-10");
    }
  });
});

describe("addMonths", () => {
  it("moves across year ends both ways", () => {
    expect(addMonths("2026-10", 1)).toBe("2026-11");
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-10", -22)).toBe("2024-12");
  });
});

describe("monthGrid", () => {
  it("covers October 2026 in whole Monday-first weeks", () => {
    const weeks = monthGrid("2026-10", "monday");
    expect(weeks).toHaveLength(5);
    // 1 Oct 2026 is a Thursday, so the grid starts on Monday 28 Sep.
    expect(weeks[0][0]).toEqual({ date: "2026-09-28", inMonth: false });
    expect(weeks[0][3]).toEqual({ date: "2026-10-01", inMonth: true });
    expect(weeks[4][6]).toEqual({ date: "2026-11-01", inMonth: false });
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("starts on Sunday when the week starts on Sunday", () => {
    const weeks = monthGrid("2026-10", "sunday");
    expect(weeks[0][0].date).toBe("2026-09-27");
    expect(weeks.at(-1)!.at(-1)!.date).toBe("2026-10-31");
  });

  it("handles leap-year February and a month that fills six weeks", () => {
    expect(monthGrid("2028-02", "monday").flat().filter((d) => d.inMonth)).toHaveLength(29);
    // August 2026 starts on a Saturday and has 31 days: six Monday-first weeks.
    expect(monthGrid("2026-08", "monday")).toHaveLength(6);
  });
});

describe("labels", () => {
  it("orders weekday headings by week start", () => {
    expect(weekdayLabels("monday")).toEqual(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
    expect(weekdayLabels("sunday")[0]).toBe("Sun");
  });

  it("names the month", () => {
    expect(formatMonth("2026-10")).toBe("October 2026");
  });
});
