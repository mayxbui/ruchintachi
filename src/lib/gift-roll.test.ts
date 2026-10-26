import { describe, expect, it } from "vitest";
import { dropChances, dropWeight, rollGift } from "./gift-roll";

/** Small seeded generator (mulberry32) so distribution tests are repeatable. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cheap = { id: "cheap", price: 1 };
const mid = { id: "mid", price: 2 };
const pricey = { id: "pricey", price: 4 };

describe("dropWeight", () => {
  it("is the inverse of the price", () => {
    expect(dropWeight(1)).toBe(1);
    expect(dropWeight(4)).toBe(0.25);
  });

  it("is 0 for free, negative or unreadable prices", () => {
    for (const price of [0, -3, Number.NaN, Number.POSITIVE_INFINITY]) expect(dropWeight(price)).toBe(0);
  });
});

describe("dropChances", () => {
  it("sums to 1 and favours cheaper items", () => {
    const chances = dropChances([cheap, mid, pricey]);
    expect(chances[0]).toBeCloseTo(4 / 7);
    expect(chances[1]).toBeCloseTo(2 / 7);
    expect(chances[2]).toBeCloseTo(1 / 7);
    expect(chances.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });

  it("is all zeros for a pool with nothing that can drop", () => {
    expect(dropChances([{ price: 0 }])).toEqual([0]);
    expect(dropChances([])).toEqual([]);
  });
});

describe("rollGift", () => {
  it("returns null when nothing can drop", () => {
    expect(rollGift([])).toBeNull();
    expect(rollGift([{ price: 0 }, { price: -1 }])).toBeNull();
  });

  it("maps the random number onto the weights in order", () => {
    const pool = [cheap, mid, pricey];
    expect(rollGift(pool, () => 0)).toBe(cheap);
    expect(rollGift(pool, () => 0.57)).toBe(cheap); // just under 4/7
    expect(rollGift(pool, () => 0.58)).toBe(mid);
    expect(rollGift(pool, () => 0.86)).toBe(pricey); // past 6/7
    expect(rollGift(pool, () => 0.999999)).toBe(pricey);
  });

  it("never picks a free item, even at the edges", () => {
    const pool = [{ id: "free", price: 0 }, cheap, { id: "free2", price: 0 }];
    for (const r of [0, 0.5, 0.999999]) expect(rollGift(pool, () => r)).toBe(cheap);
  });

  it("drops items in proportion to 1 / price over many rolls", () => {
    const pool = [cheap, mid, pricey];
    const random = seeded(42);
    const counts = new Map<string, number>();
    const rolls = 70_000;
    for (let i = 0; i < rolls; i++) {
      const id = rollGift(pool, random)!.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    // Expected 40k / 20k / 10k; allow 2% of all rolls either way.
    expect(Math.abs(counts.get("cheap")! - 40_000)).toBeLessThan(rolls * 0.02);
    expect(Math.abs(counts.get("mid")! - 20_000)).toBeLessThan(rolls * 0.02);
    expect(Math.abs(counts.get("pricey")! - 10_000)).toBeLessThan(rolls * 0.02);
  });
});
