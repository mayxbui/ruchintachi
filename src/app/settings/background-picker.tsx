"use client";

import { IconCheck } from "@tabler/icons-react";
import Image from "next/image";
import { useState, useTransition } from "react";
import { previewBackground } from "@/components/page-background";
import { backgrounds, type BackgroundId } from "@/lib/backgrounds";
import { setBackgroundAction } from "./actions";

const PUFFS = 8;

/** Grid of square previews; a tap switches the background with no Save button. */
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
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {backgrounds.map((bg) => {
          const current = bg.id === selected;
          return (
            <li key={bg.id}>
              <button
                type="button"
                onClick={() => pick(bg.id)}
                aria-pressed={current}
                aria-label={bg.label}
                className={`group relative block aspect-square w-full rounded-2xl shadow-pop transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny ${
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
                      sizes="(min-width: 768px) 10rem, (min-width: 640px) 25vw, 33vw"
                      className="object-cover"
                    />
                  </span>
                  <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-full bg-white/85 px-2 py-0.5 text-center text-sm">
                    {bg.label}
                  </span>
                </span>
                {current && (
                  <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-tangerine text-white shadow-pop">
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
      {error && (
        <p role="alert" className="mt-3 font-bold text-cherry">
          {error}
        </p>
      )}
    </div>
  );
}
