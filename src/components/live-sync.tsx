"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const CHANNEL = "ruchintachi:changes";

// Set while this window refreshes because another window said data changed,
// so that render isn't announced back (no ping-pong). It expires, so a
// refresh that brings nothing new can't swallow a later change of our own.
const QUIET_MS = 3000;
let quietUntil = 0;

/**
 * Keeps the main tab, other tabs and the pop-out (#66) in step. The root
 * layout renders this with a fresh `stamp` every time it renders on the
 * server, which (after the first load) happens when a server action changes
 * data: ticking, adding, renaming, editing or deleting a task. A new stamp
 * is announced on a BroadcastChannel; the other windows of this browser
 * then refresh their data. Navigating between pages keeps the root layout,
 * so it announces nothing.
 */
export function LiveSync({ stamp }: { stamp: number }) {
  const router = useRouter();
  const channel = useRef<BroadcastChannel | null>(null);
  const last = useRef(stamp);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(CHANNEL);
    ch.onmessage = () => {
      quietUntil = Date.now() + QUIET_MS;
      router.refresh();
    };
    channel.current = ch;
    return () => {
      ch.close();
      channel.current = null;
    };
  }, [router]);

  useEffect(() => {
    if (stamp === last.current) return;
    last.current = stamp;
    if (Date.now() < quietUntil) {
      quietUntil = 0;
      return;
    }
    channel.current?.postMessage("changed");
  }, [stamp]);

  return null;
}
