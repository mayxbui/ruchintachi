import { describe, expect, it } from "vitest";
import { dailyGiftPool, earnsDailyGift } from "./daily-gift";
import { itemsIn } from "./items";

const habit = (done: boolean) => ({ repeats: true, done });
const oneOff = (done: boolean) => ({ repeats: false, done });

describe("earnsDailyGift", () => {
  it("needs at least one repeating habit", () => {
    expect(earnsDailyGift([])).toBe(false);
    // One-off tasks alone never earn a gift, even all done.
    expect(earnsDailyGift([oneOff(true)])).toBe(false);
    expect(earnsDailyGift([oneOff(true), oneOff(true)])).toBe(false);
  });

  it("needs every repeating habit done", () => {
    expect(earnsDailyGift([habit(true)])).toBe(true);
    expect(earnsDailyGift([habit(true), habit(true)])).toBe(true);
    expect(earnsDailyGift([habit(true), habit(false)])).toBe(false);
    expect(earnsDailyGift([habit(false)])).toBe(false);
  });

  it("ignores one-off tasks either way", () => {
    expect(earnsDailyGift([habit(true), oneOff(false)])).toBe(true);
    expect(earnsDailyGift([habit(false), oneOff(true)])).toBe(false);
  });
});

describe("dailyGiftPool", () => {
  it("holds food, goods and treasures but no clothing", () => {
    const pool = dailyGiftPool();
    expect(pool.length).toBe(itemsIn("food").length + itemsIn("goods").length + itemsIn("treasure").length);
    expect(pool.some((item) => item.category === "clothing")).toBe(false);
  });
});
