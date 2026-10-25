import { describe, expect, it } from "vitest";
import { isDevAutoSignIn } from "./dev-sign-in";

describe("isDevAutoSignIn", () => {
  it("is on only in development with the flag set to true", () => {
    expect(isDevAutoSignIn({ NODE_ENV: "development", DEV_AUTO_SIGNIN: "true" })).toBe(true);
  });

  it("never applies to a production build, even with the flag set", () => {
    expect(isDevAutoSignIn({ NODE_ENV: "production", DEV_AUTO_SIGNIN: "true" })).toBe(false);
    expect(isDevAutoSignIn({ NODE_ENV: "test", DEV_AUTO_SIGNIN: "true" })).toBe(false);
  });

  it("is off when the flag is missing or not exactly true", () => {
    expect(isDevAutoSignIn({ NODE_ENV: "development" })).toBe(false);
    expect(isDevAutoSignIn({ NODE_ENV: "development", DEV_AUTO_SIGNIN: "1" })).toBe(false);
    expect(isDevAutoSignIn({ NODE_ENV: "development", DEV_AUTO_SIGNIN: "false" })).toBe(false);
  });
});
