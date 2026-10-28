"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ItemSprite } from "@/components/item-sprite";
import type { DailyGift } from "./actions";

const WOBBLE_MS = 1400; // how long the paper bag shakes before it opens
const BURST = 10; // puffs when it opens

/**
 * Tomodachi-style gift reveal for the daily gift (#17): the game's paper bag
 * wobbles, pops open and the item rises out with its name. Tapping the bag
 * opens it straight away. With reduced motion it opens at once.
 */
export function GiftReveal({ gift, onClose }: { gift: DailyGift; onClose: () => void }) {
  const [open, setOpen] = useState(false);
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timeout = window.setTimeout(() => setOpen(true), reduce ? 0 : WOBBLE_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (open) okRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-reveal-title"
      className="animate-bg-in fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
      onClick={(e) => {
        if (open && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-warning-in flex w-full max-w-xs flex-col items-center gap-4 rounded-blob bg-cream px-6 pt-8 pb-6 text-center shadow-pop">
        <h2 id="gift-reveal-title" className="text-2xl">
          {open ? "You got a gift!" : "A present for you!"}
        </h2>

        <div className="relative flex h-40 w-40 items-end justify-center">
          {open ? (
            <>
              <span aria-hidden className="poof pointer-events-none absolute inset-x-0 top-1/3">
                {Array.from({ length: BURST }, (_, i) => (
                  <i key={i} style={{ "--angle": `${(360 / BURST) * i}deg` } as React.CSSProperties} />
                ))}
              </span>
              <div className="animate-gift-rise flex size-32 items-center justify-center rounded-full bg-white shadow-pop">
                <ItemSprite item={gift} size={96} />
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open the gift bag"
              className="animate-gift-wobble relative min-w-0 rounded-none bg-transparent shadow-none"
            >
              <Image src="/ItemPaperbag.png" alt="" width={128} height={128} priority className="size-32" />
            </button>
          )}
        </div>

        {/* Kept in the DOM so screen readers hear the item once it's revealed. */}
        <p aria-live="polite" className="min-h-14 text-lg">
          {open && (
            <>
              <span className="block text-xl font-black">{gift.name}</span>
              <span className="text-base text-caption">Added to your items</span>
            </>
          )}
        </p>

        <button
          ref={okRef}
          type="button"
          onClick={onClose}
          disabled={!open}
          className="bg-tangerine px-8 py-2 font-bold text-white transition disabled:invisible"
        >
          Yay!
        </button>
      </div>
    </div>
  );
}
