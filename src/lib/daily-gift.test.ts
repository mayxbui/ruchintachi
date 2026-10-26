import { describe, expect, it } from "vitest";
import { dailyGiftPool, earnsDailyGift } from "./daily-gift";
import { itemsIn } from "./items";

describe("earnsDailyGift", () => {
  it("needs at least one task", () => {
    expect(earnsDailyGift([])).toBe(false);
  });

  it("needs every task done", () => {
    expect(earnsDailyGift([{ done: true }])).toBe(true);
    expect(earnsDailyGift([{ done: true }, { done: true }])).toBe(true);
    expect(earnsDailyGift([{ done: true }, { done: false }])).toBe(false);
    expect(earnsDailyGift([{ done: false }])).toBe(false);
  });
});

describe("dailyGiftPool", () => {
  it("holds food, goods and treasures but no clothing", () => {
    const pool = dailyGiftPool();
    expect(pool.length).toBe(itemsIn("food").length + itemsIn("goods").length + itemsIn("treasure").length);
    expect(pool.some((item) => item.category === "clothing")).toBe(false);
  });
});
