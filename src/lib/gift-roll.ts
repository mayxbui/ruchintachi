// Gift rolls (#15). Pure: the caller passes the pool and a random source, so
// the server can roll with Math.random and tests with a seeded generator.
// Rarity comes from price: an item's drop weight is 1 / price, so a $2 item
// drops twice as often as a $4 one. Free or unpriced items never drop.

/** Relative chance of dropping an item at this price; 0 = never. */
export function dropWeight(price: number): number {
  return Number.isFinite(price) && price > 0 ? 1 / price : 0;
}

/** Each item's chance (0–1) of being the gift, in pool order. */
export function dropChances(pool: readonly { price: number }[]): number[] {
  const weights = pool.map((item) => dropWeight(item.price));
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w) => (total > 0 ? w / total : 0));
}

/**
 * Picks one item, weighted by dropWeight. `random` returns a number in [0, 1)
 * like Math.random. Returns null when nothing in the pool can drop.
 */
export function rollGift<T extends { price: number }>(
  pool: readonly T[],
  random: () => number = Math.random,
): T | null {
  const weights = pool.map((item) => dropWeight(item.price));
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return null;

  let target = random() * total;
  let last: T | null = null;
  for (let i = 0; i < pool.length; i++) {
    if (weights[i] === 0) continue;
    last = pool[i];
    target -= weights[i];
    if (target < 0) return pool[i];
  }
  // Floating-point rounding can leave a sliver past the end.
  return last;
}
