import { describe, expect, it } from "vitest";
import { BULK_MAX, parseBulkIds, planBulkDelete } from "./bulk-edit";
import type { RepeatRule } from "./repeat-rule";

const today = "2026-10-28";
const rule = (id: string, extra: Partial<RepeatRule>): RepeatRule & { id: string } => ({
  id,
  name: id,
  startDate: today,
  frequency: "daily",
  endType: "never",
  ...extra,
});

describe("parseBulkIds", () => {
  it("takes a non-empty list of strings, without repeats", () => {
    expect(parseBulkIds(["a", "b", "a"])).toEqual(["a", "b"]);
  });

  it("rejects anything else", () => {
    expect(parseBulkIds([])).toBeNull();
    expect(parseBulkIds("a")).toBeNull();
    expect(parseBulkIds(["a", 1])).toBeNull();
    expect(parseBulkIds([""])).toBeNull();
    expect(parseBulkIds(Array.from({ length: BULK_MAX + 1 }, (_, i) => `id${i}`))).toBeNull();
  });
});

describe("planBulkDelete", () => {
  it("removes tasks with no past days and ends the rest yesterday", () => {
    const plan = planBulkDelete(
      [
        rule("new", {}),
        rule("later", { startDate: "2026-11-01" }),
        rule("old", { startDate: "2026-10-01" }),
        rule("once", { frequency: "none" }),
      ],
      [],
      today,
    );
    expect(plan.remove).toEqual(["new", "later", "once"]);
    expect(plan.end).toEqual([{ id: "old", endDate: "2026-10-27" }]);
  });

  it("leaves finished tasks alone, so their history stays", () => {
    const plan = planBulkDelete(
      [
        rule("past one-off", { frequency: "none", startDate: "2026-10-20" }),
        rule("ended", { startDate: "2026-10-01", endType: "on_date", endDate: "2026-10-10" }),
      ],
      [],
      today,
    );
    expect(plan).toEqual({ remove: [], end: [] });
  });

  it("counts skipped days: a series whose only days left are skipped is finished", () => {
    const plan = planBulkDelete(
      [rule("skip", { startDate: "2026-10-01", endType: "on_date", endDate: today })],
      [{ habitId: "skip", date: today, overrideName: null }],
      today,
    );
    expect(plan).toEqual({ remove: [], end: [] });
  });
});
