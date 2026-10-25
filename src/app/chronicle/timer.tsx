"use client";

import {
  IconHourglassHigh,
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconX,
} from "@tabler/icons-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  formatClock,
  IDLE,
  pauseTimer,
  remainingMs,
  resumeTimer,
  startTimer,
  tickTimer,
  type TimerState,
} from "@/lib/timer";

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
 * One countdown timer for the Chronicle tabs. Lives in the tabs layout, so
 * it keeps running when the user switches between Today and Tasks. Nothing
 * is saved on the server.
 */
export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TimerState>(IDLE);
  const [now, setNow] = useState(() => Date.now());
  const audioRef = useRef<AudioContext | null>(null);
  const running = state.status === "running";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      setState((s) => tickTimer(s, t));
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // Alert once when a timer finishes. It doesn't tick the task.
  const alerted = useRef<TimerState | null>(null);
  useEffect(() => {
    if (state.status !== "done" || alerted.current === state) return;
    alerted.current = state;
    if (audioRef.current) chime(audioRef.current);
    navigator.vibrate?.([200, 100, 200]);
  }, [state]);

  const start = useCallback((habitId: string, name: string, minutes: number) => {
    // Browsers only allow sound after a tap, so set audio up on Start.
    audioRef.current ??= new AudioContext();
    void audioRef.current.resume();
    const t = Date.now();
    setNow(t);
    setState(startTimer(habitId, name, minutes, t));
  }, []);
  const pause = useCallback(() => setState((s) => pauseTimer(s, Date.now())), []);
  const resume = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) => resumeTimer(s, t));
  }, []);
  const reset = useCallback(() => setState(IDLE), []);

  const value = useMemo(
    () => ({ state, now, start, pause, resume, reset }),
    [state, now, start, pause, resume, reset],
  );
  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

/** The running timer, shown under the tabs on both Today and Tasks. */
export function TimerBar() {
  const { state, now, pause, resume, reset } = useTimer();
  if (state.status === "idle") return null;

  if (state.status === "done") {
    return (
      <div
        role="alert"
        className="mb-6 flex items-center gap-3 rounded-2xl bg-sunny px-4 py-3 shadow-pop motion-safe:animate-bounce motion-safe:[animation-iteration-count:2]"
      >
        <IconHourglassHigh aria-hidden className="size-6 shrink-0" stroke={2.25} />
        <p className="min-w-0 flex-1 font-bold break-words">
          Time&apos;s up for {state.name}! Tick it off when you&apos;re done.
        </p>
        <button
          type="button"
          onClick={reset}
          aria-label="Dismiss timer"
          className="min-w-0 shrink-0 bg-white p-2"
        >
          <IconX className="size-5" stroke={2.5} />
        </button>
      </div>
    );
  }

  const paused = state.status === "paused";
  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-pop">
      <IconHourglassHigh aria-hidden className="size-6 shrink-0 text-tangerine" stroke={2.25} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold">{state.name}</span>
        <span className="block text-caption">{paused ? "Paused" : "Timer running"}</span>
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
        {paused ? (
          <IconPlayerPlayFilled className="size-5" />
        ) : (
          <IconPlayerPauseFilled className="size-5" />
        )}
      </button>
      <button
        type="button"
        onClick={reset}
        aria-label="Stop timer"
        className="min-w-0 shrink-0 bg-white p-2"
      >
        <IconX className="size-5" stroke={2.5} />
      </button>
    </div>
  );
}
