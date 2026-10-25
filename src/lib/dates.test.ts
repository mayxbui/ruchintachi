import { describe, expect, it } from "vitest";
import { addDays, startOfWeek, todayIn, weekDates } from "./dates";

describe("todayIn", () => {
  it("uses the user's time zone, not UTC", () => {
    const now = new Date("2026-10-25T20:00:00Z");
    expect(todayIn("UTC", now)).toBe("2026-10-25");
    expect(todayIn("Asia/Tokyo", now)).toBe("2026-10-26");
    expect(todayIn("America/Los_Angeles", now)).toBe("2026-10-25");
  });
});

describe("addDays", () => {
  it("crosses month and leap-year boundaries", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("startOfWeek", () => {
  // 2026-10-25 is a Sunday.
  it("Monday start", () => {
    expect(startOfWeek("2026-10-25", "monday")).toBe("2026-10-19");
    expect(startOfWeek("2026-10-26", "monday")).toBe("2026-10-26");
  });

  it("Sunday start", () => {
    expect(startOfWeek("2026-10-25", "sunday")).toBe("2026-10-25");
    expect(startOfWeek("2026-10-31", "sunday")).toBe("2026-10-25");
  });
});

describe("weekDates", () => {
  it("returns seven consecutive days from the week start", () => {
    expect(weekDates("2026-10-28", "monday")).toEqual([
      "2026-10-26",
      "2026-10-27",
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});
