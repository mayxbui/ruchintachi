"use client";

import {
  IconHourglassHigh,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconX,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  formatClock,
  IDLE,
  parseTimerState,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
  tickTimer,
  type TimerState,
} from "@/lib/timer";

// ---------------------------------------------------------------------------
// Store: the timer lives in localStorage, one key per user, so it survives
// switching pages and reloads, and the main tab and the pop-out (#66), which
// share the origin, see the same timer. Another window's change arrives as a
// "storage" event. Nothing is saved on the server.

const KEY_PREFIX = "ruchintachi:timer:";

type Store = {
  get: () => TimerState;
  set: (state: TimerState) => void;
  subscribe: (onChange: () => void) => () => void;
};

const stores = new Map<string, Store>();

function storeFor(userId: string): Store {
  const key = KEY_PREFIX + userId;
  let store = stores.get(key);
  if (store) return store;

  const listeners = new Set<() => void>();
  let memory: string | null = null; // used when storage is blocked
  let cachedRaw: string | null | undefined;
  let cached: TimerState = IDLE;

  const read = (): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return memory;
    }
  };

  store = {
    get() {
      const raw = read();
      if (raw !== cachedRaw) {
        cachedRaw = raw;
        cached = parseTimerState(raw);
      }
      return cached;
    },
    set(state) {
      const raw = state.status === "idle" ? null : JSON.stringify(state);
      memory = raw;
      try {
        if (raw === null) localStorage.removeItem(key);
        else localStorage.setItem(key, raw);
      } catch {
        // Blocked storage: this window keeps the timer in memory only.
      }
      listeners.forEach((l) => l());
    },
    subscribe(onChange) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key || e.key === null) onChange();
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
  stores.set(key, store);
  return store;
}

/** Forgets every saved timer in this browser; called on sign-out. */
export function clearSavedTimers() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(KEY_PREFIX)) localStorage.removeItem(k);
    }
  } catch {
    // Nothing saved when storage is blocked.
  }
}

// ---------------------------------------------------------------------------

type Timer = {
  state: TimerState;
  now: number;
  start: (habitId: string, name: string, minutes: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
};

const TimerContext = createContext<Timer | null>(null);

export function useTimer(): Timer {
  const timer = useContext(TimerContext);
  if (!timer) throw new Error("useTimer must be used inside <TimerProvider>");
  return timer;
}

/** The pop-out widget's page, shown in the always-on-top window. */
const POP_OUT_PATH = "/widget";

/** Two soft notes, made with Web Audio so there's no sound file to load. */
function chime(audio: AudioContext) {
  [660, 880].forEach((freq, i) => {
    const at = audio.currentTime + i * 0.35;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.6);
    osc.connect(gain).connect(audio.destination);
    osc.start(at);
    osc.stop(at + 0.65);
  });
}

/**
 * True when this tab's pop-out is open and can play sound (the user has
 * tapped in it), so the pop-out chimes instead of this tab.
 */
function popOutWillChime(): boolean {
  try {
    const frame = window.documentPictureInPicture?.window?.document.querySelector("iframe");
    return !!frame?.contentWindow?.navigator.userActivation?.hasBeenActive;
  } catch {
    return false;
  }
}

/**
 * One countdown timer for the whole site, kept in the root layout so it
 * keeps running on every page, and shared with the pop-out.
 */
export function TimerProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const store = storeFor(userId);
  const state = useSyncExternalStore(store.subscribe, store.get, () => IDLE);
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const popOut = usePathname() === POP_OUT_PATH;
  const running = state.status === "running";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const current = store.get();
      const next = tickTimer(current, t);
      if (next !== current) store.set(next);
    }, 250);
    return () => clearInterval(id);
  }, [running, store]);

  // Browsers only play sound after a tap, so set audio up on the first one
  // (the timer may have been started in another window or before a reload).
  useEffect(() => {
    const events = ["pointerdown", "keydown"] as const;
    const unlock = () => {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume();
      events.forEach((e) => window.removeEventListener(e, unlock, true));
    };
    events.forEach((e) => window.addEventListener(e, unlock, true));
    return () => events.forEach((e) => window.removeEventListener(e, unlock, true));
  }, []);

  // Alert once when the timer runs out: in the pop-out when it's open,
  // otherwise in the main tab. It doesn't tick the task.
  const previous = useRef(state.status);
  useEffect(() => {
    const was = previous.current;
    previous.current = state.status;
    if (was !== "running" || state.status !== "done") return;
    if (!popOut && popOutWillChime()) return;
    if (audioRef.current) chime(audioRef.current);
    // Like sound, vibration is only allowed once the user has tapped the page.
    if (navigator.userActivation?.hasBeenActive ?? true) navigator.vibrate?.([200, 100, 200]);
  }, [state.status, popOut]);

  const start = useCallback(
    (habitId: string, name: string, minutes: number) => {
      audioRef.current ??= new AudioContext();
      void audioRef.current.resume();
      const t = Date.now();
      setNow(t);
      store.set(startTimer(habitId, name, minutes, t));
    },
    [store],
  );
  const pause = useCallback(() => store.set(pauseTimer(store.get(), Date.now())), [store]);
  const resume = useCallback(() => {
    const t = Date.now();
    setNow(t);
    store.set(resumeTimer(store.get(), t));
  }, [store]);
  const reset = useCallback(() => store.set(IDLE), [store]);

  const value = useMemo(
    () => ({ state, now, start, pause, resume, reset }),
    [state, now, start, pause, resume, reset],
  );
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

/**
 * The timer as a small card in the bottom-right corner, on every page and in
 * the pop-out, while one is set. On phones it sits above the bottom tab bar.
 */
export function FloatingTimer() {
  const { state, now, pause, resume, reset } = useTimer();
  const popOut = usePathname() === POP_OUT_PATH;
  if (state.status === "idle") return null;

  const place = popOut
    ? "inset-x-2 bottom-2"
    : "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] sm:left-auto sm:right-4 sm:w-96 md:right-6 md:bottom-6";

  if (state.status === "done") {
    return (
      <div
        role="alert"
        className={`floating-timer fixed z-50 flex items-center gap-3 rounded-2xl bg-sunny px-4 py-3 shadow-pop motion-safe:animate-bounce motion-safe:[animation-iteration-count:2] ${place}`}
      >
        <IconHourglassHigh aria-hidden className="size-6 shrink-0" stroke={2.25} />
        <p className="min-w-0 flex-1 font-bold break-words">
          Time&apos;s up for {state.name}! Tick it off when you&apos;re done.
        </p>
        <button type="button" onClick={reset} aria-label="Dismiss timer" className="min-w-0 shrink-0 bg-white p-2">
          <IconX className="size-5" stroke={2.5} />
        </button>
      </div>
    );
  }

  const paused = state.status === "paused";
  return (
    <div
      role="timer"
      aria-label={`Timer for ${state.name}`}
      className={`floating-timer fixed z-50 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop ${place}`}
    >
      <IconHourglassHigh aria-hidden className="size-6 shrink-0 text-tangerine" stroke={2.25} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{state.name}</span>
        <span className="block text-sm text-caption">{paused ? "Paused" : "Timer running"}</span>
      </span>
      <span className="font-mono text-2xl font-bold tabular-nums" aria-live="off">
        {formatClock(remainingMs(state, now))}
      </span>
      <button
        type="button"
        onClick={paused ? resume : pause}
        aria-label={paused ? "Resume timer" : "Pause timer"}
        className="min-w-0 shrink-0 bg-tangerine p-2 text-white"
      >
        {paused ? <IconPlayerPlayFilled className="size-5" /> : <IconPlayerPauseFilled className="size-5" />}
      </button>
      <button type="button" onClick={reset} aria-label="Stop timer" className="min-w-0 shrink-0 bg-white p-2">
        <IconX className="size-5" stroke={2.5} />
      </button>
    </div>
  );
}
