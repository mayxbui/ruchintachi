import { describe, expect, it } from "vitest";
import { itemsIn } from "./items";
import { rollWeeklyGift, weeklyGiftPool, weeksDue } from "./weekly-gift";

/** A random source that returns the given values in turn. */
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

describe("weeklyGiftPool", () => {
  it("holds food, goods and treasures but no clothing", () => {
    const pool = weeklyGiftPool();
    expect(pool.length).toBe(itemsIn("food").length + itemsIn("goods").length + itemsIn("treasure").length);
    expect(pool.some((item) => item.category === "clothing")).toBe(false);
  });
});

describe("rollWeeklyGift", () => {
  // Weights 1/1, 1/2, 1/4: cheap 4/7, mid 2/7, rare 1/7.
  const pool = [
    { id: "cheap", price: 1 },
    { id: "mid", price: 2 },
    { id: "rare", price: 4 },
  ];

  it("gives nothing for a week with no complete days", () => {
    expect(rollWeeklyGift(0, pool, sequence(0.99))).toBeNull();
  });

  it("rolls once per complete day and keeps the most expensive", () => {
    expect(rollWeeklyGift(1, pool, sequence(0))?.id).toBe("cheap");
    expect(rollWeeklyGift(3, pool, sequence(0, 0.99, 0.7))?.id).toBe("rare");
    expect(rollWeeklyGift(2, pool, sequence(0.7, 0))?.id).toBe("mid");
  });

  it("gets rarer with more rolls", () => {
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const average = (rolls: number) => {
      let total = 0;
      for (let i = 0; i < 2000; i++) total += rollWeeklyGift(rolls, pool, random)!.price;
      return total / 2000;
    };
    expect(average(7)).toBeGreaterThan(average(1));
  });
});

describe("weeksDue", () => {
  it("lists finished weeks from the start date (Monday weeks)", () => {
    // 2026-11-01 is a Sunday, so the first Monday week starts on the 2nd.
    expect(weeksDue("2026-11-08", "monday")).toEqual([]); // the 2nd–8th week isn't over yet
    expect(weeksDue("2026-11-09", "monday")).toEqual(["2026-11-02"]);
    expect(weeksDue("2026-11-17", "monday")).toEqual(["2026-11-02", "2026-11-09"]);
  });

  it("starts Sunday weeks on the start date itself", () => {
    expect(weeksDue("2026-11-08", "sunday")).toEqual(["2026-11-01"]);
  });

  it("only lists weeks after the last rewarded one", () => {
    expect(weeksDue("2026-11-17", "monday", "2026-11-02")).toEqual(["2026-11-09"]);
    expect(weeksDue("2026-11-17", "monday", "2026-11-09")).toEqual([]);
  });

  it("never overlaps the last rewarded week after a week-start change", () => {
    // Rewarded Mon 2–Sun 8; now on Sunday weeks, the next whole week is Sun 15–Sat 21.
    expect(weeksDue("2026-11-22", "sunday", "2026-11-02")).toEqual(["2026-11-15"]);
  });
});
