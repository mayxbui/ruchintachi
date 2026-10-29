import { describe, expect, it } from "vitest";
import { formatReleaseDate, sortReleases, type Release } from "./changelog";

const release = (version: string, date: string, extra: Partial<Release> = {}): Release => ({
  version,
  date,
  title: "Update",
  tag: "feature",
  changes: ["Something new"],
  ...extra,
});

describe("sortReleases", () => {
  it("puts the newest date first", () => {
    const sorted = sortReleases([
      release("1.0.0", "2026-10-25"),
      release("1.2.0", "2026-11-02"),
      release("1.1.0", "2026-10-28"),
    ]);
    expect(sorted.map((r) => r.version)).toEqual(["1.2.0", "1.1.0", "1.0.0"]);
  });

  it("orders releases on the same day by version number", () => {
    const sorted = sortReleases([release("1.9.0", "2026-10-28"), release("1.10.0", "2026-10-28")]);
    expect(sorted.map((r) => r.version)).toEqual(["1.10.0", "1.9.0"]);
  });

  it("accepts sections instead of a flat list", () => {
    const major = release("2.0.0", "2026-10-28", {
      major: true,
      changes: undefined,
      sections: [{ heading: "New look", changes: ["Fresh logo"] }],
    });
    expect(sortReleases([major])).toHaveLength(1);
  });

  it("rejects bad versions, dates and tags", () => {
    expect(() => sortReleases([release("1.0", "2026-10-28")])).toThrow();
    expect(() => sortReleases([release("1.0.0", "2026-02-30")])).toThrow();
    expect(() => sortReleases([release("1.0.0", "2026-10-28", { tag: "bug" as never })])).toThrow();
  });

  it("rejects a duplicate version", () => {
    expect(() => sortReleases([release("1.0.0", "2026-10-28"), release("1.0.0", "2026-10-29")])).toThrow();
  });

  it("rejects a release with nothing in it", () => {
    expect(() => sortReleases([release("1.0.0", "2026-10-28", { title: " " })])).toThrow();
    expect(() => sortReleases([release("1.0.0", "2026-10-28", { changes: [] })])).toThrow();
    expect(() =>
      sortReleases([
        release("1.0.0", "2026-10-28", {
          changes: undefined,
          sections: [{ heading: "Empty", changes: [] }],
        }),
      ]),
    ).toThrow();
  });
});

describe("formatReleaseDate", () => {
  it("writes the date out in words", () => {
    expect(formatReleaseDate("2026-10-28")).toBe("October 28, 2026");
  });
});
