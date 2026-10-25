// Fixed-window attempt counter. The app runs as one process on one VM,
// so memory is enough; counts reset when the server restarts.

export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  /** Records an attempt. Returns false when `key` is over the limit. */
  consume(key: string): boolean {
    const t = this.now();
    const entry = this.hits.get(key);
    if (!entry || entry.resetAt <= t) {
      this.prune(t);
      this.hits.set(key, { count: 1, resetAt: t + this.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= this.limit;
  }

  /** Forget a key, e.g. after a successful sign-in. */
  reset(key: string): void {
    this.hits.delete(key);
  }

  private prune(t: number) {
    for (const [key, entry] of this.hits) {
      if (entry.resetAt <= t) this.hits.delete(key);
    }
  }
}
