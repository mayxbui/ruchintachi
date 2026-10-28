import { describe, expect, it } from "vitest";
import { formatUpdateDate, sortUpdates, updates } from "./whats-new";

const entry = (date: string) => ({ date, title: "Update", changes: ["Something new"] });

describe("sortUpdates", () => {
  it("puts the newest first", () => {
    const sorted = sortUpdates([entry("2026-10-25"), entry("2026-11-02"), entry("2026-10-28")]);
    expect(sorted.map((u) => u.date)).toEqual(["2026-11-02", "2026-10-28", "2026-10-25"]);
  });

  it("rejects dates that don't exist or aren't YYYY-MM-DD", () => {
    expect(() => sortUpdates([entry("2026-02-30")])).toThrow();
    expect(() => sortUpdates([entry("28/10/2026")])).toThrow();
  });

  it("rejects a missing title or empty changes", () => {
    expect(() => sortUpdates([{ ...entry("2026-10-28"), title: " " }])).toThrow();
    expect(() => sortUpdates([{ ...entry("2026-10-28"), changes: [] }])).toThrow();
    expect(() => sortUpdates([{ ...entry("2026-10-28"), changes: [""] }])).toThrow();
  });
});

describe("whats-new.json", () => {
  it("loads and is not empty", () => {
    expect(updates.length).toBeGreaterThan(0);
  });
});

describe("formatUpdateDate", () => {
  it("writes the date out in words", () => {
    expect(formatUpdateDate("2026-10-28")).toBe("28 October 2026");
  });
});
