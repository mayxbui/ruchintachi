import { describe, expect, it } from "vitest";
import { townEnabled } from "./features";

describe("townEnabled", () => {
  it("is on only for FEATURE_TOWN=true", () => {
    expect(townEnabled({ FEATURE_TOWN: "true" })).toBe(true);
    expect(townEnabled({ FEATURE_TOWN: "false" })).toBe(false);
    expect(townEnabled({ FEATURE_TOWN: "1" })).toBe(false);
    expect(townEnabled({})).toBe(false);
  });
});
