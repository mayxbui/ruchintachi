"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const EVERY_MS = 5 * 60_000;

/**
 * Re-fetches /widget's data when its window comes back into focus or view,
 * and every five minutes, so ticks made in the main tab and the day rolling
 * over show up (#65).
 */
export function WidgetRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const timer = setInterval(refresh, EVERY_MS);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      clearInterval(timer);
    };
  }, [router]);
  return null;
}
