"use client";

import { IconBackground } from "@tabler/icons-react";
import { useCallback, useId, useRef, useState } from "react";
import type { BackgroundId } from "@/lib/backgrounds";
import { BackgroundPicker } from "./background-picker";
import { popoverClass } from "./dropdown";
import { useDismiss } from "./use-dismiss";

/** Square button at the right of the navbar; opens the background picker (#43). */
export function BackgroundButton({ background }: { background: BackgroundId }) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, ref);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Change background"
        title="Change background"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex size-13 min-w-0 items-center justify-center rounded-2xl bg-cream/90 text-slate-500 shadow-pop transition duration-300 ease-[cubic-bezier(.3,1.8,.5,1)] hover:-translate-y-0.5 hover:-rotate-6 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny motion-reduce:hover:transform-none ${
          open ? "text-ink ring-4 ring-sunny" : ""
        }`}
      >
        <IconBackground aria-hidden className="size-6" stroke={2.25} />
      </button>
      {open && (
        <div
          id={id}
          role="dialog"
          aria-label="Change background"
          className={`${popoverClass} right-0 w-[min(26rem,calc(100vw-2rem))]`}
        >
          {/* White inner card so the picks read clearly on the yellow popover. */}
          <div className="max-h-[70dvh] overflow-x-hidden overflow-y-auto rounded-2xl bg-cream p-3">
            <p className="mb-2 px-1 font-bold">Background</p>
            <BackgroundPicker background={background} />
          </div>
        </div>
      )}
    </div>
  );
}
