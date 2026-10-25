import { describe, expect, it } from "vitest";
import {
  isValidTimeZone,
  normalizeUsername,
  passwordError,
  usernameError,
} from "./credentials";
import {
  generateFriendCode,
  generateRecoveryCode,
  generateSessionToken,
  hashToken,
  normalizeRecoveryCode,
} from "./tokens";
import { RateLimiter } from "../rate-limit";

describe("usernames", () => {
  it("are trimmed and lowercased", () => {
    expect(normalizeUsername("  May_Bui ")).toBe("may_bui");
  });

  it("allow 3–20 letters, numbers and underscores", () => {
    expect(usernameError("may")).toBeNull();
    expect(usernameError("a_b_9")).toBeNull();
    expect(usernameError("ab")).not.toBeNull();
    expect(usernameError("a".repeat(21))).not.toBeNull();
    expect(usernameError("may bui")).not.toBeNull();
    expect(usernameError("may@bui")).not.toBeNull();
  });
});

describe("passwords", () => {
  it("need 8–128 characters", () => {
    expect(passwordError("1234567")).not.toBeNull();
    expect(passwordError("12345678")).toBeNull();
    expect(passwordError("x".repeat(129))).not.toBeNull();
  });
});

describe("isValidTimeZone", () => {
  it("accepts IANA zones and rejects junk", () => {
    expect(isValidTimeZone("Asia/Tokyo")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});

describe("tokens", () => {
  it("session tokens are random and stored only as a hash", () => {
    const a = generateSessionToken();
    expect(a).not.toBe(generateSessionToken());
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken(a)).toBe(hashToken(a));
  });

  it("recovery codes are four groups of four", () => {
    expect(generateRecoveryCode()).toMatch(
      /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$/,
    );
  });

  it("recovery codes survive sloppy typing", () => {
    const code = "7K2Q-M9XD-40PA-HB1W";
    expect(normalizeRecoveryCode(" 7k2q m9xd-4opa hblw ")).toBe(
      normalizeRecoveryCode(code),
    );
  });

  it("friend codes look like 1234-5678-9012", () => {
    expect(generateFriendCode()).toMatch(/^\d{4}-\d{4}-\d{4}$/);
  });
});

describe("RateLimiter", () => {
  it("blocks after the limit and opens again after the window", () => {
    let t = 0;
    const limiter = new RateLimiter(3, 1000, () => t);
    expect([1, 2, 3].map(() => limiter.consume("ip"))).toEqual([
      true,
      true,
      true,
    ]);
    expect(limiter.consume("ip")).toBe(false);
    expect(limiter.consume("other")).toBe(true);
    t = 1000;
    expect(limiter.consume("ip")).toBe(true);
  });

  it("reset clears a key", () => {
    const limiter = new RateLimiter(1, 1000, () => 0);
    limiter.consume("u");
    expect(limiter.consume("u")).toBe(false);
    limiter.reset("u");
    expect(limiter.consume("u")).toBe(true);
  });
});
