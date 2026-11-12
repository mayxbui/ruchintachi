"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconBuildingCommunity,
  IconCalendarHeart,
  IconNotebook,
  IconSettings,
} from "@tabler/icons-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

// Each tab has its own blob colour (a theme colour name). `bg` is the same
// colour as a class, painted on the link before the blob is measured.
const allTabs = [
  { href: "/chronicle", label: "My Chronicle", icon: IconNotebook, colour: "tangerine", bg: "bg-tangerine" },
  { href: "/progress", label: "Progress", icon: IconCalendarHeart, colour: "sky", bg: "bg-sky" },
  { href: "/town", label: "Town", icon: IconBuildingCommunity, colour: "leaf", bg: "bg-leaf" },
  { href: "/settings", label: "Settings", icon: IconSettings, colour: "cherry", bg: "bg-cherry" },
] as const;
const tabsWithoutTown = allTabs.filter((tab) => tab.href !== "/town");

// Liquid-gel indicator: a big blob slides to the new tab, squashing and
// stretching, and wobbles like jelly when it lands. A short chain of small
// droplets trails behind it; an SVG goo filter melts it all into one liquid shape.
const DURATION = 950; // ms for the big blob's trip
const GOO_ID = "nav-goo"; // also spelled out in the blob layer's md:[filter:url(#nav-goo)]

// Trailing droplets, biggest first: diameter (share of the blob's height),
// how long each waits before chasing, and its trip time.
const DROPS = [
  { size: 0.9, hold: 0.2, duration: DURATION * 1.2 },
  { size: 0.7, hold: 0.3, duration: DURATION * 1.4 },
];

type Box = { left: number; width: number; top: number; height: number };

function boxOf(link: HTMLElement): Box {
  return {
    left: link.offsetLeft,
    width: link.offsetWidth,
    top: link.offsetTop,
    height: link.offsetHeight,
  };
}

function place(el: HTMLElement, b: Box) {
  el.style.left = `${b.left}px`;
  el.style.width = `${b.width}px`;
  el.style.top = `${b.top}px`;
  el.style.height = `${b.height}px`;
}

const px = (b: Box) => ({
  left: `${b.left}px`,
  width: `${b.width}px`,
  top: `${b.top}px`,
  height: `${b.height}px`,
});

/** A theme colour's value, e.g. "sky" -> "#2f6fd6". */
function themeColour(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

/** Big blob: stretches long and thin mid-way, overshoots, then wobbles like jelly. */
function animateBlob(el: HTMLElement, from: Box, to: Box, fromColour: string, toColour: string) {
  const distance = Math.abs(to.left - from.left);
  const mid: Box = {
    left: Math.min(from.left, to.left) + distance * 0.2,
    width: (from.width + to.width) / 2 + distance * 0.15,
    top: from.top + 4,
    height: from.height - 8,
  };
  const over: Box = { left: to.left - 6, width: to.width + 12, top: to.top - 2, height: to.height + 4 };
  el.animate(
    [px(from), { ...px(mid), offset: 0.5 }, { ...px(over), offset: 0.8 }, px(to)],
    { duration: DURATION, easing: "cubic-bezier(.45,0,.25,1)" },
  );
  // Jelly settle: wide, tall, wide, still.
  el.animate(
    [
      { transform: "scale(1, 1)" },
      { transform: "scale(1.12, 0.84)", offset: 0.3 },
      { transform: "scale(0.94, 1.1)", offset: 0.45 },
      { transform: "scale(1.04, 0.96)", offset: 0.7 },
      { transform: "scale(1, 1)" },
    ],
    { duration: 650, delay: DURATION * 0.75, easing: "ease-out" },
  );
  el.animate([{ backgroundColor: fromColour }, { backgroundColor: toColour }], {
    duration: DURATION * 0.7,
    easing: "ease-in-out",
  });
  el.style.backgroundColor = toColour;
}

/**
 * Drop: a circle `size` × the blob's height that stays behind for `hold` of
 * its trip, then chases the blob and melts into its centre.
 */
function animateDrop(
  el: HTMLElement,
  from: Box,
  to: Box,
  colours: [string, string],
  { size, hold, duration }: { size: number; hold: number; duration: number },
) {
  const d = from.height * size;
  const circle = (cx: number): Box => ({
    left: cx - d / 2,
    width: d,
    top: from.top + (from.height - d) / 2,
    height: d,
  });
  const fromX = from.left + from.width / 2;
  const toX = to.left + to.width / 2;
  el.animate(
    [
      px(circle(fromX)),
      { ...px(circle(fromX)), offset: hold },
      { ...px(circle(fromX + (toX - fromX) * 0.6)), offset: 0.65 },
      px(circle(toX)),
    ],
    { duration, easing: "cubic-bezier(.5,0,.3,1)" },
  );
  el.animate([{ backgroundColor: colours[0] }, { backgroundColor: colours[1] }], {
    duration,
    easing: "ease-in-out",
  });
  el.style.backgroundColor = colours[1];
  place(el, circle(toX));
}

/**
 * Pill bar; the active tab sits on a coloured gel blob. On phones it floats
 * at the bottom of the screen, icons only, without the goo filter (iOS
 * Safari paints its edges as coloured slivers outside the blob).
 */
export function NavBar({ town }: { town: boolean }) {
  // Town is left out while it's switched off (src/lib/features.ts).
  const tabs = town ? allTabs : tabsWithoutTown;
  const pathname = usePathname();
  const routeIndex = tabs.findIndex((tab) => pathname.startsWith(tab.href));
  // Move the blob on click, before the next page has loaded.
  const [clicked, setClicked] = useState<{ index: number; from: string } | null>(null);
  // Forget that click once the page changes, so a later visit back to `from`
  // by another link (e.g. Q&A) follows the route, not the old click.
  const [shownPath, setShownPath] = useState(pathname);
  if (shownPath !== pathname) {
    setShownPath(pathname);
    setClicked(null);
  }
  const activeIndex = clicked && clicked.from === pathname ? clicked.index : routeIndex;

  const listRef = useRef<HTMLUListElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const blobRef = useRef<HTMLSpanElement>(null);
  const dropRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const shownIndex = useRef<number | null>(null);
  // Until the blob is measured, the active link paints its own pill (no flash on load).
  const [ready, setReady] = useState(false);

  const snap = useCallback(() => {
    const index = shownIndex.current;
    const link = index === null || index < 0 ? null : linkRefs.current[index];
    for (const el of [blobRef.current, ...dropRefs.current]) {
      if (!el) continue;
      el.getAnimations().forEach((a) => a.cancel());
      el.style.opacity = link ? "1" : "0";
      if (link && index !== null) {
        place(el, boxOf(link));
        el.style.backgroundColor = themeColour(tabs[index].colour);
      }
    }
  }, [tabs]);

  useLayoutEffect(() => {
    const blob = blobRef.current;
    const drops = dropRefs.current;
    const prev = shownIndex.current;
    shownIndex.current = activeIndex;
    if (!blob) return;

    const fromLink = prev === null || prev < 0 ? null : linkRefs.current[prev];
    const toLink = activeIndex < 0 ? null : linkRefs.current[activeIndex];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fromLink || !toLink || prev === null || prev === activeIndex || reduced) {
      snap();
    } else {
      const from = boxOf(fromLink);
      const to = boxOf(toLink);
      const colours: [string, string] = [
        themeColour(tabs[prev].colour),
        themeColour(tabs[activeIndex].colour),
      ];
      animateBlob(blob, from, to, ...colours);
      DROPS.forEach((drop, i) => {
        const el = drops[i];
        if (el) animateDrop(el, from, to, colours, drop);
      });
      place(blob, to);
    }
    setReady(true);
  }, [activeIndex, snap, tabs]);

  // Re-measure when fonts finish loading or the bar changes size.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(snap);
    observer.observe(list);
    document.fonts?.ready.then(snap);
    return () => observer.disconnect();
  }, [snap]);

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-40 overflow-x-auto rounded-full bg-cream/95 p-2 shadow-pop [scrollbar-width:none] sm:inset-x-4 sm:p-3 md:static md:w-auto md:justify-self-center"
    >
      <svg aria-hidden width="0" height="0" className="absolute">
        <filter id={GOO_ID}>
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 26 -11"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      <ul
        ref={listRef}
        className="relative flex min-w-max justify-between gap-0 sm:gap-1 md:gap-2"
      >
        {/* Shadow outside the goo filter so it follows the merged shape. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 drop-shadow-md">
          <span className="absolute inset-0 md:[filter:url(#nav-goo)]">
            {DROPS.map((_, i) => (
              <span
                key={i}
                ref={(el) => {
                  dropRefs.current[i] = el;
                }}
                className="absolute rounded-full opacity-0 max-md:hidden"
              />
            ))}
            <span ref={blobRef} className="absolute rounded-full opacity-0" />
          </span>
        </span>
        {tabs.map((tab, i) => {
          const active = i === activeIndex;
          return (
            <li key={tab.href}>
              <Link
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                href={tab.href}
                onClick={() => setClicked({ index: i, from: pathname })}
                aria-current={i === routeIndex ? "page" : undefined}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[16px] font-bold whitespace-nowrap transition-[color,background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(.3,1.8,.5,1)] sm:px-4 xl:px-6 lg:text-base ${
                  active
                    ? `text-white ${ready ? "" : `${tab.bg} shadow-md`}`
                    : // Springy wiggle on hover (none with reduced motion).
                      "text-slate-500 hover:-translate-y-0.5 hover:-rotate-3 hover:text-ink motion-reduce:hover:transform-none"
                }`}
              >
                <tab.icon aria-hidden className="size-6 shrink-0 md:size-5" stroke={2.25} />
                {/* Icons only below lg (room for the streak and coins); the label is still read out. */}
                <span className="sr-only lg:not-sr-only">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
