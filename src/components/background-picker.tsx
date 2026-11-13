"use client";

import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { setBackgroundAction } from "@/app/background-actions";
import { backgrounds, type BackgroundId } from "@/lib/backgrounds";
import { previewBackground } from "./page-background";

const PUFFS = 8;

/**
 * Scrolls the picked tile into view inside the 3×3 window (it may be below
 * its fold), without scrolling the page itself.
 */
function scrollIntoView(el: HTMLLIElement | null) {
  const list = el?.parentElement;
  if (!el || !list) return;
  const top = el.getBoundingClientRect().top - list.getBoundingClientRect().top;
  if (top < 0 || top + el.offsetHeight > list.clientHeight) list.scrollTop += top - 6;
}

/** Scrolling grid of square previews, as wide as its card; a tap switches the background with no Save button. */
export function BackgroundPicker({ background }: { background: BackgroundId }) {
  const [selected, setSelected] = useState(background);
  const [poof, setPoof] = useState<{ id: BackgroundId; key: number } | null>(null);
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();

  function pick(id: BackgroundId) {
    if (id === selected) return;
    const previous = selected;
    setError(undefined);
    setSelected(id);
    setPoof((p) => ({ id, key: (p?.key ?? 0) + 1 }));
    previewBackground(id);
    startTransition(async () => {
      const result = await setBackgroundAction(id);
      if (result.error) {
        setSelected(previous);
        previewBackground(previous);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      {/* A window three rows tall that scrolls, with more columns on wider
          cards: tiles are 1/4, 1/5, 1/6 or 1/8 of the width, so three rows
          are 75cqw, 60cqw, 50cqw or 37.5cqw tall. The padding leaves room for the picked
          tile's ring and the hover lift. */}
      <div className="@container">
        <ul
          id="background-settings"
          aria-label="Backgrounds"
          className="grid max-h-[75cqw] grid-cols-4 gap-2 overflow-y-auto overscroll-contain p-1.5 @md:max-h-[60cqw] @md:grid-cols-5 @2xl:max-h-[50cqw] @2xl:grid-cols-6 @4xl:max-h-[37.5cqw] @4xl:grid-cols-8"
        >
          {backgrounds.map((bg) => {
            const current = bg.id === selected;
            return (
              <li key={bg.id} ref={current ? scrollIntoView : undefined}>
                <button
                  type="button"
                  onClick={() => pick(bg.id)}
                  aria-pressed={current}
                  aria-label={bg.label}
                  className={`group relative block aspect-square w-full min-w-0 rounded-2xl shadow-pop transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny ${
                    current ? "ring-4 ring-tangerine" : ""
                  }`}
                >
                  {/* Keyed so a new pick replays the pop without remounting the button. */}
                  <span
                    key={poof?.id === bg.id ? poof.key : 0}
                    className={`absolute inset-0 ${poof?.id === bg.id ? "animate-tile-pop" : ""}`}
                  >
                    <span className="absolute inset-0 overflow-hidden rounded-2xl">
                      <Image
                        src={bg.file}
                        alt=""
                        fill
                        sizes="8rem"
                        className="object-cover"
                      />
                    </span>
                    <span className="absolute inset-x-1 bottom-1 truncate rounded-full bg-white/85 px-1.5 text-center text-xs">
                      {bg.label}
                    </span>
                  </span>
                  {current && (
                    <span className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-tangerine text-white shadow-pop">
                      <IconCheck className="size-4" stroke={3} />
                    </span>
                  )}
                  {poof?.id === bg.id && (
                    <span key={poof.key} aria-hidden className="poof pointer-events-none absolute inset-0">
                      {Array.from({ length: PUFFS }, (_, i) => (
                        <i key={i} style={{ "--angle": `${(360 / PUFFS) * i}deg` } as React.CSSProperties} />
                      ))}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {error && (
        <p role="alert" className="mt-3 font-bold text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}
