"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { RoundCheck } from "./round-check";

const steps = [
  {
    id: "create-habit",
    path: "/chronicle",
    title: "Add a habit",
    description: "Choose Create a habit (+), give it a name, and set how often it repeats. Check it off from Today when it’s due.",
  },
  {
    id: "items-heading",
    path: "/progress",
    title: "Find your gifts and treasures",
    description: "Finish every repeating habit on at least one day to earn a weekly gift. Open My Chronicle after the week ends to reveal it, then find it under My treasures in Progress.",
  },
  {
    id: "time-zone-settings",
    path: "/settings",
    title: "Set your time zone",
    description: "Choose your time zone or use your device’s, then select Save. Today resets at midnight in your chosen zone.",
  },
  {
    id: "background-settings",
    path: "/settings",
    title: "Change your background",
    description: "Select a picture to update the background across the app. Your choice saves automatically.",
  },
] as const;

type Step = (typeof steps)[number];
const storageEvent = "ruchintachi-guide-change";
const serverSnapshot = () => null;
const actionClass = "rounded-full bg-tangerine px-4 py-2 text-sm font-bold text-white";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(storageEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(storageEvent, callback);
  };
}

export function GettingStarted({ userId }: { userId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const key = `ruchintachi-guide:${userId}`;
  const saved = useSyncExternalStore(subscribe, () => {
    try {
      return localStorage.getItem(key) ?? "";
    } catch {
      return "";
    }
  }, serverSnapshot);
  const [sessionProgress, setSessionProgress] = useState<string | null>(null);
  const [active, setActive] = useState<Step | null>(null);
  const [expanded, setExpanded] = useState<boolean | null>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, () => matchMedia("(min-width: 64rem)").matches, () => false);
  const [previousPath, setPreviousPath] = useState(pathname);
  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    if (active?.path !== pathname) setActive(null);
  }
  const progress = (sessionProgress ?? saved ?? "").split(",");
  const hidden = progress.includes("hidden");
  const openGuide = expanded ?? desktop;

  function save(values: string[]) {
    const value = values.join(",");
    try {
      localStorage.setItem(key, value);
      window.dispatchEvent(new Event(storageEvent));
    } catch {
      setSessionProgress(value);
    }
  }

  function open(step: Step) {
    if (!desktop) setExpanded(false);
    setActive(step);
    if (pathname !== step.path) router.push(step.path, { scroll: false });
  }

  return (
    <>
      {saved !== null && !hidden && (
        // Top offset matches the header padding, logo height, and main padding in RootLayout.
        <aside className="fixed top-21 right-10 z-[45] max-h-[65dvh] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-3xl border-4 border-sunny bg-cream/90 shadow-pop sm:top-28 sm:right-4 md:top-38" data-guide-expanded={openGuide}>
          <button type="button" aria-expanded={openGuide} aria-controls="guide-checklist" onClick={() => setExpanded(!openGuide)} className="w-full bg-transparent px-2 py-2 text-left text-xs font-black shadow-none min-[360px]:px-3 min-[360px]:text-sm lg:text-base">
            Getting started <span aria-hidden>{openGuide ? "▾" : "▸"}</span>
          </button>
          <div id="guide-checklist" hidden={!openGuide} className="w-56 max-w-full px-3 pb-2">
            <ul className="mt-2 space-y-1">
              {steps.map((step) => {
                const reviewed = progress.includes(step.id);
                return (
                  <li key={step.id}>
                    <button type="button" onClick={() => open(step)} className="flex w-full items-center gap-2 rounded-xl bg-white px-2 py-2 text-left text-sm font-bold">
                      <RoundCheck checked={reviewed} />
                      {step.title}
                      <span className="sr-only">, {reviewed ? "reviewed" : "to do"}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <button type="button" onClick={() => save([...progress, "hidden"])} className="mt-2 bg-transparent px-2 py-1 text-sm shadow-none">
              Hide guide
            </button>
          </div>
        </aside>
      )}
      {!hidden && active?.path === pathname && (
        <Spotlight
          key={active.id}
          step={active}
          onClose={() => setActive(null)}
          onDone={() => {
            save([...new Set([...progress.filter(Boolean), active.id])]);
            setActive(null);
          }}
        />
      )}
    </>
  );
}

function subscribeDesktop(callback: () => void) {
  const query = matchMedia("(min-width: 64rem)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function placeInstruction(rect: DOMRect, panel: HTMLElement) {
  const margin = 12;
  const gap = 14;
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  const bottomEdge = viewportHeight - (viewportWidth < 768 ? 92 : margin);
  const { offsetWidth: width, offsetHeight: height } = panel;
  const right = rect.right + gap;
  const below = rect.bottom + gap;
  const above = rect.top - gap - height;
  const fitsRight = right + width <= viewportWidth - margin && rect.bottom > margin && rect.top < bottomEdge;
  const fitsBelow = below + height <= bottomEdge;
  const moreRoomBelow = above < margin && bottomEdge - below >= rect.top - margin;
  const top = fitsRight ? rect.top : fitsBelow || moreRoomBelow ? below : above;

  return {
    left: Math.max(margin, Math.min(fitsRight ? right : rect.left, viewportWidth - width - margin)),
    top: Math.max(margin, Math.min(top, bottomEdge - height)),
  };
}

function Spotlight({ step, onClose, onDone }: { step: Step; onClose: () => void; onDone: () => void }) {
  const [position, setPosition] = useState<{ rect: DOMRect; left: number; top: number } | null>(null);
  const panel = useRef<HTMLElement>(null);
  const positioned = position !== null;

  useEffect(() => {
    if (positioned) panel.current?.focus({ preventScroll: true });
  }, [positioned]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    let target: HTMLElement | null = null;
    function measure() {
      if (!target || !panel.current) return;
      const rect = target.getBoundingClientRect();
      setPosition({ rect, ...placeInstruction(rect, panel.current) });
    }
    const observer = new ResizeObserver(measure);
    const routeObserver = new MutationObserver(findTarget);
    function findTarget() {
      target = document.getElementById(step.id);
      if (!target) return;
      routeObserver.disconnect();
      target.scrollIntoView({ block: "center", behavior: "instant" });
      observer.observe(target);
      measure();
    }
    routeObserver.observe(document.querySelector("main") ?? document.body, { childList: true, subtree: true });
    findTarget();
    const dialog = panel.current;
    if (dialog) observer.observe(dialog);
    observer.observe(document.body);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      routeObserver.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected &&
          (document.activeElement === document.body || dialog?.contains(document.activeElement))) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [step]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function finish() {
    const target = document.getElementById(step.id);
    const control = target?.matches("a, button, select") ? target : target?.querySelector<HTMLElement>("select, button");
    control?.focus({ preventScroll: true });
    onDone();
  }

  const rect = position?.rect;
  return (
    <div className="pointer-events-none fixed inset-0 z-[60]">
      {rect && (
        <div aria-hidden className="absolute rounded-xl ring-4 ring-sunny shadow-[0_0_0_200vmax_rgba(0,0,0,0.65)]" style={{
          top: rect.top - 3, left: rect.left - 3, width: rect.width + 6, height: rect.height + 6,
        }} />
      )}
      <section
        ref={panel}
        role="dialog"
        aria-label={step.title}
        aria-describedby="guide-step-description"
        tabIndex={-1}
        className="pointer-events-auto absolute max-h-[calc(100dvh-7rem)] w-[min(22rem,calc(100%-1.5rem))] overflow-y-auto rounded-3xl border-4 border-sunny bg-cream p-4 shadow-pop"
        style={{ left: position?.left, top: position?.top, visibility: position ? "visible" : "hidden" }}
      >
        <h2 className="text-lg">{step.title}</h2>
        <p id="guide-step-description" className="mt-1 text-sm">{step.description}</p>
        <div className="mt-3 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="bg-white px-4 py-2 text-sm font-bold">Close</button>
          <button type="button" onClick={finish} className={actionClass}>Got it</button>
        </div>
      </section>
    </div>
  );
}
