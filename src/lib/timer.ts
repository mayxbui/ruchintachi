// Countdown timer for a task. Pure: the UI keeps a TimerState and passes the
// current time in, so it stays right even when the browser throttles a
// background tab (it counts down to an end time rather than adding up ticks).

export const TIMER_PRESETS = [5, 10, 15, 25] as const; // minutes
export const TIMER_MAX_MINUTES = 180;

export type TimerState =
  | { status: "idle" }
  | {
      status: "running";
      habitId: string;
      name: string;
      durationMs: number;
      endsAt: number; // epoch ms
    }
  | {
      status: "paused" | "done";
      habitId: string;
      name: string;
      durationMs: number;
      remainingMs: number;
    };

export const IDLE: TimerState = { status: "idle" };

/** Minutes typed by the user, as a whole number in range, or null. */
export function parseMinutes(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= TIMER_MAX_MINUTES ? n : null;
}

export function startTimer(habitId: string, name: string, minutes: number, now: number): TimerState {
  const durationMs = minutes * 60_000;
  return { status: "running", habitId, name, durationMs, endsAt: now + durationMs };
}

/** Milliseconds left (never negative). */
export function remainingMs(state: TimerState, now: number): number {
  if (state.status === "idle") return 0;
  if (state.status === "running") return Math.max(state.endsAt - now, 0);
  return state.remainingMs;
}

export function pauseTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "running") return state;
  const { habitId, name, durationMs } = state;
  return { status: "paused", habitId, name, durationMs, remainingMs: remainingMs(state, now) };
}

export function resumeTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "paused") return state;
  const { habitId, name, durationMs } = state;
  return { status: "running", habitId, name, durationMs, endsAt: now + state.remainingMs };
}

/** Moves a running timer to "done" once its time is up; otherwise unchanged. */
export function tickTimer(state: TimerState, now: number): TimerState {
  if (state.status !== "running" || now < state.endsAt) return state;
  const { habitId, name, durationMs } = state;
  return { status: "done", habitId, name, durationMs, remainingMs: 0 };
}

/** "mm:ss", or "h:mm:ss" from an hour up. Rounds up so it never shows 0:00 early. */
export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/**
 * Reads a TimerState saved in the browser (shared by the main tab and the
 * pop-out). Anything malformed, from an old version or edited by hand, is IDLE.
 */
export function parseTimerState(raw: string | null): TimerState {
  if (!raw) return IDLE;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return IDLE;
  }
  if (typeof v !== "object" || v === null) return IDLE;
  const o = v as Record<string, unknown>;
  const num = (x: unknown) => typeof x === "number" && Number.isFinite(x) && x >= 0;
  if (typeof o.habitId !== "string" || typeof o.name !== "string" || !num(o.durationMs)) return IDLE;
  const { habitId, name } = o;
  const durationMs = o.durationMs as number;
  if (o.status === "running" && num(o.endsAt)) {
    return { status: "running", habitId, name, durationMs, endsAt: o.endsAt as number };
  }
  if ((o.status === "paused" || o.status === "done") && num(o.remainingMs)) {
    return { status: o.status, habitId, name, durationMs, remainingMs: o.remainingMs as number };
  }
  return IDLE;
}
