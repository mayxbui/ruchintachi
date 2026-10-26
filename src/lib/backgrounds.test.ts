import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { backgroundFor, backgrounds, DEFAULT_BACKGROUND, isBackgroundId } from "./backgrounds";

describe("backgrounds", () => {
  it("has 15 unique ids with the original first and as default", () => {
    expect(backgrounds).toHaveLength(15);
    expect(new Set(backgrounds.map((b) => b.id)).size).toBe(15);
    expect(backgrounds[0].id).toBe(DEFAULT_BACKGROUND);
  });

  it("points every entry at an image in public/", () => {
    for (const b of backgrounds) expect(existsSync(`public${b.file}`), b.file).toBe(true);
  });

  it("validates ids", () => {
    expect(isBackgroundId("space")).toBe(true);
    expect(isBackgroundId("nope")).toBe(false);
    expect(isBackgroundId(3)).toBe(false);
    expect(isBackgroundId(undefined)).toBe(false);
  });

  it("falls back to the original for unknown ids", () => {
    expect(backgroundFor("beach").id).toBe("beach");
    expect(backgroundFor("gone").id).toBe("og");
    expect(backgroundFor(null).id).toBe("og");
  });
});
