import { describe, expect, it } from "vitest";
import { dayProgress, itemsOn, type DayHabit } from "./today";

// 2026-10-26 is a Monday.
const water: DayHabit = {
  id: "water",
  name: "Drink water",
  icon: "water",
  note: "After lunch",
  startDate: "2026-10-01",
  frequency: "daily",
  endType: "never",
};
const run: DayHabit = {
  id: "run",
  name: "Run",
  icon: null,
  startDate: "2026-10-01",
  frequency: "weekly",
  weekdays: [1, 3],
  endType: "never",
};
const future: DayHabit = { ...water, id: "future", name: "Later", startDate: "2026-11-01" };

describe("itemsOn", () => {
  it("lists only habits scheduled that day, in order, with done flags", () => {
    expect(itemsOn([water, run, future], [], new Set(["run"]), "2026-10-26")).toEqual([
      { habitId: "water", name: "Drink water", icon: "water", note: "After lunch", repeats: true, done: false },
      { habitId: "run", name: "Run", icon: null, note: null, repeats: true, done: true },
    ]);
    expect(itemsOn([water, run], [], new Set(), "2026-10-27").map((i) => i.habitId)).toEqual([
      "water",
    ]);
  });

  it("leaves out a skipped day and uses a renamed day's name", () => {
    const exceptions = [
      { habitId: "water", date: "2026-10-26", overrideName: null },
      { habitId: "run", date: "2026-10-26", overrideName: "Short run" },
      { habitId: "run", date: "2026-10-28", overrideName: null }, // other day, ignored
    ];
    expect(itemsOn([water, run], exceptions, new Set(), "2026-10-26")).toEqual([
      { habitId: "run", name: "Short run", icon: null, note: null, repeats: true, done: false },
    ]);
  });

  it("marks one-off tasks as not repeating", () => {
    const oneOff: DayHabit = { ...water, id: "call", name: "Call mum", startDate: "2026-10-26", frequency: "none" };
    expect(itemsOn([oneOff, water], [], new Set(), "2026-10-26").map((i) => [i.habitId, i.repeats])).toEqual([
      ["call", false],
      ["water", true],
    ]);
  });

  it("only applies a habit's own exceptions", () => {
    const exceptions = [{ habitId: "run", date: "2026-10-27", overrideName: null }];
    expect(itemsOn([water], exceptions, new Set(), "2026-10-27")).toHaveLength(1);
  });
});

describe("dayProgress", () => {
  it("counts done and scheduled", () => {
    expect(dayProgress([{ done: true }, { done: false }, { done: true }])).toEqual({
      done: 2,
      total: 3,
    });
  });

  it("an empty day has total 0", () => {
    expect(dayProgress([])).toEqual({ done: 0, total: 0 });
  });
});
