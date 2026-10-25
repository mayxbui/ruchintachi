import { describe, expect, it } from "vitest";
import {
  formatClock,
  IDLE,
  parseMinutes,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
  tickTimer,
} from "./timer";

const t0 = 1_000_000;

describe("timer", () => {
  it("counts down to an end time", () => {
    const s = startTimer("h1", "Stretch", 10, t0);
    expect(remainingMs(s, t0)).toBe(600_000);
    expect(remainingMs(s, t0 + 90_000)).toBe(510_000);
    expect(remainingMs(s, t0 + 999_999)).toBe(0); // never negative
  });

  it("pauses and resumes without losing or gaining time", () => {
    let s = startTimer("h1", "Stretch", 10, t0);
    s = pauseTimer(s, t0 + 60_000);
    expect(s.status).toBe("paused");
    expect(remainingMs(s, t0 + 500_000)).toBe(540_000); // frozen while paused
    s = resumeTimer(s, t0 + 500_000);
    expect(remainingMs(s, t0 + 560_000)).toBe(480_000);
  });

  it("becomes done when time is up, and only then", () => {
    const s = startTimer("h1", "Stretch", 1, t0);
    expect(tickTimer(s, t0 + 59_999)).toBe(s);
    expect(tickTimer(s, t0 + 60_000)).toMatchObject({ status: "done", remainingMs: 0, name: "Stretch" });
  });

  it("ignores pause/resume/tick in the wrong state", () => {
    expect(pauseTimer(IDLE, t0)).toBe(IDLE);
    expect(resumeTimer(IDLE, t0)).toBe(IDLE);
    const running = startTimer("h1", "Stretch", 5, t0);
    expect(resumeTimer(running, t0)).toBe(running);
    expect(remainingMs(IDLE, t0)).toBe(0);
  });
});

describe("parseMinutes", () => {
  it("accepts whole minutes from 1 to 180", () => {
    expect(parseMinutes("25")).toBe(25);
    expect(parseMinutes("180")).toBe(180);
    for (const bad of ["0", "181", "2.5", "", "ten", "-5"]) expect(parseMinutes(bad)).toBeNull();
  });
});

describe("formatClock", () => {
  it("shows mm:ss, rounding up, and h:mm:ss from an hour", () => {
    expect(formatClock(600_000)).toBe("10:00");
    expect(formatClock(59_001)).toBe("01:00");
    expect(formatClock(500)).toBe("00:01");
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(3_725_000)).toBe("1:02:05");
  });
});
