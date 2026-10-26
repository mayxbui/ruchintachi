"use client";

import { IconAlertCircle } from "@tabler/icons-react";
import { useEffect, useState } from "react";

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Warning = { field: Field; message: string; top: number; left: number; key: number };

const BUBBLE_ID = "field-warning";

/** The field itself, or the nearest visible thing to point at (e.g. a styled sr-only checkbox). */
function anchorOf(field: Field): Element {
  let el: Element | null = field;
  while (el && el.getBoundingClientRect().width <= 1) el = el.parentElement;
  return el ?? field;
}

/**
 * Replaces the browser's grey "Please fill out this field" popups with a
 * bubble in the site's style, for every form on every page. It listens for
 * the `invalid` event, so the browser's own checks (required, min, max,
 * maxLength, type) still decide what's wrong and say it in the user's
 * language; only the look changes. Mounted once in the root layout.
 */
export function FieldWarning() {
  const [warning, setWarning] = useState<Warning | null>(null);

  useEffect(() => {
    let shownThisSubmit = false;

    function place(field: Field) {
      const r = anchorOf(field).getBoundingClientRect();
      return { top: r.bottom + 10, left: Math.max(16, Math.min(r.left + 8, window.innerWidth - 16 - 260)) };
    }

    function onInvalid(e: Event) {
      const field = e.target as Field;
      e.preventDefault(); // no native popup
      // A submit fires `invalid` on every bad field; point at the first only.
      if (shownThisSubmit) return;
      shownThisSubmit = true;
      queueMicrotask(() => (shownThisSubmit = false));
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: "nearest", behavior: "smooth" });
      // Place after the scroll settles a little; scroll events keep it in step.
      setWarning((w) => ({ field, message: field.validationMessage, ...place(field), key: (w?.key ?? 0) + 1 }));
    }

    function onScrollOrResize() {
      setWarning((w) => (w ? { ...w, ...place(w.field) } : w));
    }

    document.addEventListener("invalid", onInvalid, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  // Mark the field while the bubble points at it; typing, leaving or
  // clicking elsewhere clears it.
  useEffect(() => {
    if (!warning) return;
    const { field } = warning;
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-describedby", BUBBLE_ID);
    const clear = () => setWarning(null);
    const timeout = window.setTimeout(clear, 5000);
    field.addEventListener("input", clear);
    field.addEventListener("change", clear);
    field.addEventListener("blur", clear);
    return () => {
      window.clearTimeout(timeout);
      field.removeAttribute("aria-invalid");
      field.removeAttribute("aria-describedby");
      field.removeEventListener("input", clear);
      field.removeEventListener("change", clear);
      field.removeEventListener("blur", clear);
    };
  }, [warning?.field, warning?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!warning) return null;
  return (
    <div
      key={warning.key}
      id={BUBBLE_ID}
      role="alert"
      style={{ top: warning.top, left: warning.left }}
      className="animate-warning-in pointer-events-none fixed z-50 flex max-w-[260px] items-center gap-2 rounded-2xl border-3 border-cherry bg-white px-3 py-2 text-base font-bold text-cherry shadow-pop"
    >
      {/* Speech-bubble tail pointing up at the field. */}
      <span
        aria-hidden
        className="absolute -top-2 left-4 size-3.5 rotate-45 rounded-tl-sm border-t-3 border-l-3 border-cherry bg-white"
      />
      <IconAlertCircle aria-hidden className="size-5 shrink-0" stroke={2.5} />
      {warning.message}
    </div>
  );
}
