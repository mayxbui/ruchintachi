"use client";

import { IconPictureInPictureOn } from "@tabler/icons-react";
import { useSyncExternalStore } from "react";

// The window fits /widget's mini laptop.
const SIZE = { width: 560, height: 400 };

const noSubscribe = () => () => {};
const hasPip = () => !!window.documentPictureInPicture;

/**
 * Opens /widget in an always-on-top mini window (#66), using Document
 * Picture-in-Picture (Chrome/Edge 116+ on desktop); hidden elsewhere. The
 * window lives with this tab, so it keeps going while the user moves around
 * the site, and closes with the tab. A second click focuses it.
 */
export function PopOutButton() {
  // Checked in the browser only, so the server render never shows the button.
  const supported = useSyncExternalStore(noSubscribe, hasPip, () => false);
  if (!supported) return null;

  async function popOut() {
    const pip = window.documentPictureInPicture!;
    if (pip.window) {
      pip.window.focus();
      return;
    }
    const win = await pip.requestWindow(SIZE);
    const doc = win.document;
    doc.title = "RuchinDachi";
    const style = doc.createElement("style");
    style.textContent =
      "html,body{margin:0;height:100%;overflow:hidden;background:#fcefc7}" +
      "iframe{display:block;width:100%;height:100%;border:0}";
    doc.head.append(style);
    const frame = doc.createElement("iframe");
    // The new window's document has no URL of its own to resolve against.
    frame.src = new URL("/widget", window.location.href).href;
    frame.title = "Today's tasks";
    doc.body.append(frame);
  }

  return (
    <button
      type="button"
      onClick={popOut}
      aria-label="Pop out today's tasks"
      data-hint="Keep today's tasks on top of other windows"
      className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white p-2.5 font-bold text-slate-500 shadow-pop transition hover:text-ink sm:p-3 md:flex md:px-5 md:py-2.5"
    >
      <IconPictureInPictureOn aria-hidden className="size-5" stroke={2.25} />
      <span className="hidden lg:inline">Pop out</span>
    </button>
  );
}
