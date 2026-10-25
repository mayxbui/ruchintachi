import { describe, expect, it } from "vitest";
import { isIsoDate, readHabitForm, validateHabit, type HabitFormValues } from "./habit-form";

const today = "2026-10-25";

const form: HabitFormValues = {
  name: "Drink water",
  icon: "water",
  startDate: today,
  frequency: "daily",
  weekdays: [],
  endType: "never",
  endDate: "",
  endCount: "",
};

const errorOf = (values: Partial<HabitFormValues>) => {
  const result = validateHabit({ ...form, ...values }, today);
  return "error" in result ? result.error : null;
};

const habitOf = (values: Partial<HabitFormValues>) => {
  const result = validateHabit({ ...form, ...values }, today);
  if ("error" in result) throw new Error(result.error);
  return result.habit;
};

describe("readHabitForm", () => {
  it("reads every field, weekdays as a list", () => {
    const data = new FormData();
    data.set("name", "Run");
    data.append("weekdays", "1");
    data.append("weekdays", "3");
    expect(readHabitForm(data)).toMatchObject({ name: "Run", weekdays: ["1", "3"], endType: "" });
  });
});

describe("isIsoDate", () => {
  it("accepts real dates only", () => {
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("2027-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("26-10-25")).toBe(false);
  });
});

describe("validateHabit", () => {
  it("accepts a plain daily habit and nulls fields that don't apply", () => {
    expect(habitOf({ weekdays: ["1"], endDate: "2026-12-01", endCount: "5" })).toEqual({
      name: "Drink water",
      icon: "water",
      startDate: today,
      frequency: "daily",
      weekdays: null,
      endType: "never",
      endDate: null,
      endCount: null,
    });
  });

  it("tidies the name and limits its length", () => {
    expect(habitOf({ name: "  Drink   water " }).name).toBe("Drink water");
    expect(errorOf({ name: "   " })).toMatch(/name/);
    expect(errorOf({ name: "x".repeat(41) })).toMatch(/40/);
  });

  it("rejects an unknown icon", () => {
    expect(errorOf({ icon: "skull" })).toMatch(/icon/);
  });

  it("allows today or later, never the past", () => {
    expect(habitOf({ startDate: "2026-11-01" }).startDate).toBe("2026-11-01");
    expect(errorOf({ startDate: "2026-10-24" })).toMatch(/past/);
    expect(errorOf({ startDate: "2026-02-30" })).toMatch(/start date/);
  });

  it("rejects an unknown frequency or end type", () => {
    expect(errorOf({ frequency: "hourly" })).toMatch(/how often/);
    expect(errorOf({ endType: "someday" })).toMatch(/ends/);
  });

  it("weekly needs at least one valid weekday, stored sorted and unique", () => {
    expect(habitOf({ frequency: "weekly", weekdays: ["5", "1", "1", "9"] }).weekdays).toEqual([1, 5]);
    expect(errorOf({ frequency: "weekly", weekdays: [] })).toMatch(/day of the week/);
  });

  it("a one-off habit never has an end", () => {
    const habit = habitOf({ frequency: "none", endType: "after_count", endCount: "3" });
    expect(habit).toMatchObject({ endType: "never", endCount: null });
  });

  it("end on a date: valid and not before the start", () => {
    expect(habitOf({ endType: "on_date", endDate: today }).endDate).toBe(today);
    expect(errorOf({ endType: "on_date", endDate: "" })).toMatch(/end date/);
    expect(errorOf({ endType: "on_date", endDate: "2026-10-24" })).toMatch(/before the start/);
  });

  it("end on a date must leave at least one occurrence", () => {
    const monthly31 = { frequency: "monthly", startDate: "2026-10-31", endType: "on_date" };
    expect(errorOf({ ...monthly31, endDate: "2026-11-30" })).toBeNull();
    expect(
      errorOf({ frequency: "weekly", weekdays: ["6"], endType: "on_date", endDate: "2026-10-30" }),
    ).toMatch(/never come up/);
  });

  it("end after N: a whole number from 1 to 999", () => {
    expect(habitOf({ endType: "after_count", endCount: "10" }).endCount).toBe(10);
    for (const endCount of ["0", "1000", "2.5", "", "ten"]) {
      expect(errorOf({ endType: "after_count", endCount })).toMatch(/1–999/);
    }
  });
});
