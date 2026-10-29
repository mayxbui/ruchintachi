import { describe, expect, it } from "vitest";
import {
  habitTallies,
  occurrencesBetween,
  ratePercent,
  rateTone,
  tally,
  type RateHabit,
} from "./completion-rate";

const habit = (id: string, extra: Partial<RateHabit> = {}): RateHabit => ({
  id,
  name: id,
  icon: null,
  startDate: "2026-10-26", // a Monday
  frequency: "daily",
  endType: "never",
  ...extra,
});

const doneOn = (entries: Record<string, string[]>) =>
  new Map(Object.entries(entries).map(([date, ids]) => [date, new Set(ids)]));

describe("occurrencesBetween", () => {
  it("lists each repeating habit's days with whether they were done", () => {
    const result = occurrencesBetween([habit("water")], [], doneOn({ "2026-10-27": ["water"] }), "2026-10-26", "2026-10-28");
    expect(result.map((o) => [o.date, o.done])).toEqual([
      ["2026-10-26", false],
      ["2026-10-27", true],
      ["2026-10-28", false],
    ]);
  });

  it("marks one-off tasks and leaves out skipped days", () => {
    const habits = [habit("water"), habit("call mum", { frequency: "none" })];
    const skipped = [{ habitId: "water", date: "2026-10-27", overrideName: null }];
    const result = occurrencesBetween(habits, skipped, new Map(), "2026-10-26", "2026-10-28");
    expect(result.map((o) => `${o.habitId} ${o.date} ${o.repeats}`)).toEqual([
      "water 2026-10-26 true",
      "call mum 2026-10-26 false",
      "water 2026-10-28 true",
    ]);
  });

  it("keeps the habit's own name when a day was renamed", () => {
    const renamed = [{ habitId: "water", date: "2026-10-26", overrideName: "Sparkling water" }];
    const [first] = occurrencesBetween([habit("water")], renamed, new Map(), "2026-10-26", "2026-10-26");
    expect(first.name).toBe("water");
  });

  it("is empty when the range is backwards (a month after today)", () => {
    expect(occurrencesBetween([habit("water")], [], new Map(), "2026-11-01", "2026-10-29")).toEqual([]);
  });
});

describe("tally and ratePercent", () => {
  const occurrences = occurrencesBetween(
    [habit("water")],
    [],
    doneOn({ "2026-10-26": ["water"], "2026-10-27": ["water"] }),
    "2026-10-26",
    "2026-10-29",
  );

  it("counts done and scheduled, optionally within dates", () => {
    expect(tally(occurrences)).toEqual({ done: 2, scheduled: 4 });
    expect(tally(occurrences, "2026-10-27", "2026-10-28")).toEqual({ done: 1, scheduled: 2 });
  });

  it("rounds to a whole percent, and is null with nothing scheduled", () => {
    expect(ratePercent({ done: 2, scheduled: 4 })).toBe(50);
    expect(ratePercent({ done: 2, scheduled: 3 })).toBe(67);
    expect(ratePercent({ done: 0, scheduled: 0 })).toBeNull();
  });
});

describe("habitTallies", () => {
  it("counts each habit, joining split series with the same name", () => {
    const before = habit("old", { name: "Stretch", endType: "on_date", endDate: "2026-10-27" });
    const after = habit("new", { name: "Stretch", startDate: "2026-10-28" });
    const occurrences = occurrencesBetween(
      [habit("water", { icon: "water" }), before, after],
      [],
      doneOn({ "2026-10-26": ["water", "old"], "2026-10-28": ["new"] }),
      "2026-10-26",
      "2026-10-28",
    );
    expect(habitTallies(occurrences)).toEqual([
      { name: "water", icon: "water", tally: { done: 1, scheduled: 3 } },
      { name: "Stretch", icon: null, tally: { done: 2, scheduled: 3 } },
    ]);
  });
});

describe("rateTone", () => {
  it("is red below 40%, yellow below 80%, green from 80%", () => {
    expect(rateTone(0)).toBe("low");
    expect(rateTone(39)).toBe("low");
    expect(rateTone(40)).toBe("mid");
    expect(rateTone(79)).toBe("mid");
    expect(rateTone(80)).toBe("high");
    expect(rateTone(100)).toBe("high");
  });
});
