"use client";

import { getImageProps } from "next/image";
import { useEffect, useState } from "react";
import { backgroundFor, type BackgroundId } from "@/lib/backgrounds";

const EVENT = "ruchintachi:background";
const FADE_MS = 450;

/** Switches the page background straight away, before the server has saved it. */
export function previewBackground(id: BackgroundId) {
  window.dispatchEvent(new CustomEvent<BackgroundId>(EVENT, { detail: id }));
}

// Same trick as the Next docs' "Background CSS" example: the optimizer's
// srcSet as image-set(), so the 1–4 MB PNGs reach the browser as small WebP.
function imageSet(id: BackgroundId) {
  const { file } = backgroundFor(id);
  const {
    props: { srcSet = "" },
  } = getImageProps({ alt: "", src: file, width: 1920, height: 1080 });
  const set = srcSet
    .split(", ")
    .map((entry) => {
      const [url, density] = entry.split(" ");
      return `url("${url}") ${density}`;
    })
    .join(", ");
  return `image-set(${set})`;
}

/** Fixed layer behind every page. A new pick fades in over the old one. */
export function PageBackground({ background }: { background: BackgroundId }) {
  const [layers, setLayers] = useState([{ id: background, key: 0 }]);
  const [saved, setSaved] = useState(background);

  function show(id: BackgroundId) {
    setLayers((current) => {
      const top = current[current.length - 1];
      return top.id === id ? current : [...current, { id, key: top.key + 1 }];
    });
  }

  // Server value changed (saved here, or in another tab after a refresh).
  if (background !== saved) {
    setSaved(background);
    show(background);
  }

  useEffect(() => {
    const onPick = (e: Event) => show((e as CustomEvent<BackgroundId>).detail);
    window.addEventListener(EVENT, onPick);
    return () => window.removeEventListener(EVENT, onPick);
  }, []);

  // Once the newest layer has faded in, drop the ones underneath.
  useEffect(() => {
    if (layers.length < 2) return;
    const timer = setTimeout(() => setLayers((current) => current.slice(-1)), FADE_MS);
    return () => clearTimeout(timer);
  }, [layers]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {layers.map((layer, i) => (
        <div
          key={layer.key}
          className={`absolute inset-0 bg-cover bg-center ${i > 0 ? "animate-bg-in" : ""}`}
          style={{ backgroundImage: imageSet(layer.id) }}
        />
      ))}
    </div>
  );
}
