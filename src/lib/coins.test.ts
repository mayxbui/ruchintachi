import { describe, expect, it } from "vitest";
import { coinsForDay, DAY_COINS_MAX } from "./coins";

const habit = (done: boolean) => ({ repeats: true, done });
const oneOff = (done: boolean) => ({ repeats: false, done });

describe("coinsForDay", () => {
  it("pays 2 per repeating habit done, up to 10", () => {
    expect(coinsForDay([habit(true), habit(false)], 0)).toBe(2);
    expect(coinsForDay([...Array(7)].map(() => habit(true)).concat(habit(false)), 3)).toBe(10);
  });

  it("pays nothing for one-off tasks", () => {
    expect(coinsForDay([oneOff(true), oneOff(true)], 5)).toBe(0);
    expect(coinsForDay([habit(false), oneOff(true)], 5)).toBe(0);
  });

  it("adds 20 and the streak bonus on a complete day only", () => {
    expect(coinsForDay([habit(true)], 1)).toBe(2 + 20 + 2);
    expect(coinsForDay([habit(true), oneOff(false)], 4)).toBe(2 + 20 + 8);
    // An unfinished day earns no streak bonus, however long the streak.
    expect(coinsForDay([habit(true), habit(false)], 9)).toBe(2);
  });

  it("caps the streak bonus at 20 and the day at 50", () => {
    expect(coinsForDay([habit(true)], 30)).toBe(2 + 20 + 20);
    const full = [...Array(6)].map(() => habit(true));
    expect(coinsForDay(full, 100)).toBe(DAY_COINS_MAX);
    expect(DAY_COINS_MAX).toBe(50);
  });
});
