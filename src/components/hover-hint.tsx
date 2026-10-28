"use client";

import { useEffect, useState } from "react";

type Spot = { top: number; above: boolean } & ({ left: number } | { right: number });
type Hint = Spot & { el: HTMLElement; text: string; key: number };

const BUBBLE_ID = "hover-hint";
const DELAY_MS = 400;
const WIDTH = 260; // max bubble width, for keeping it on screen
const ROOM = 64; // space a bubble needs below the element before it flips above

/**
 * Replaces the browser's grey `title` tooltips with a bubble in the site's
 * style (like FieldWarning, in yellow), for every page. Give an element
 * `data-hint="…"` instead of `title`. It shows after a short hover with a
 * mouse, or at once on keyboard focus; clicking, typing or scrolling hides it.
 * Touch screens have no hover, so it never shows there. Mounted once in the
 * root layout.
 */
export function HoverHint() {
  const [hint, setHint] = useState<Hint | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    let current: HTMLElement | null = null;

    // Below the element (above it near the bottom of the screen), lined up
    // with its left edge, or its right edge when that's near the right side.
    function place(el: HTMLElement): Spot {
      const r = el.getBoundingClientRect();
      const above = r.bottom + ROOM > window.innerHeight;
      const top = above ? r.top - 10 : r.bottom + 10;
      const width = document.documentElement.clientWidth; // without the scrollbar, like `right`
      return r.left + WIDTH > width - 16
        ? { top, above, right: Math.max(16, width - r.right) }
        : { top, above, left: Math.max(16, r.left) };
    }

    function show(el: HTMLElement) {
      const text = el.dataset.hint;
      if (!text) return;
      setHint((h) => ({ el, text, ...place(el), key: (h?.key ?? 0) + 1 }));
    }

    function hide() {
      window.clearTimeout(timer);
      current = null;
      setHint(null);
    }

    const hinted = (target: EventTarget | null) =>
      target instanceof Element ? target.closest<HTMLElement>("[data-hint]") : null;

    function onPointerOver(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const el = hinted(e.target);
      if (el === current) return;
      hide();
      if (!el) return;
      current = el;
      timer = window.setTimeout(() => show(el), DELAY_MS);
    }

    function onPointerOut(e: PointerEvent) {
      if (current && !(e.relatedTarget instanceof Node && current.contains(e.relatedTarget))) hide();
    }

    function onFocusIn(e: FocusEvent) {
      const el = hinted(e.target);
      if (el && el === e.target && el.matches(":focus-visible")) {
        window.clearTimeout(timer);
        current = el;
        show(el);
      }
    }

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("pointerdown", hide, true);
    document.addEventListener("keydown", hide, true);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("pointerdown", hide, true);
      document.removeEventListener("keydown", hide, true);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, []);

  // Screen readers hear the hint with the element while it shows.
  useEffect(() => {
    if (!hint) return;
    const { el } = hint;
    const before = el.getAttribute("aria-describedby");
    el.setAttribute("aria-describedby", [before, BUBBLE_ID].filter(Boolean).join(" "));
    return () => {
      if (before) el.setAttribute("aria-describedby", before);
      else el.removeAttribute("aria-describedby");
    };
  }, [hint?.el, hint?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hint) return null;
  return (
    <div
      key={hint.key}
      id={BUBBLE_ID}
      role="tooltip"
      style={{
        top: hint.top,
        ...("left" in hint ? { left: hint.left } : { right: hint.right }),
        maxWidth: WIDTH,
      }}
      className={`animate-warning-in pointer-events-none fixed z-50 rounded-2xl border-3 border-sunny bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-pop ${
        hint.above ? "-translate-y-full" : ""
      }`}
    >
      {/* Speech-bubble tail pointing at the element. */}
      <span
        aria-hidden
        className={`absolute size-3.5 rotate-45 border-sunny bg-white ${"left" in hint ? "left-4" : "right-4"} ${
          hint.above ? "-bottom-2 rounded-br-sm border-r-3 border-b-3" : "-top-2 rounded-tl-sm border-t-3 border-l-3"
        }`}
      />
      <span className="relative">{hint.text}</span>
    </div>
  );
}
