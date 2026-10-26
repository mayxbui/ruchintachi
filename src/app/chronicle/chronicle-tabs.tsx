"use client";

import { IconListDetails, IconPlus, IconSunHigh } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { href: "/chronicle", label: "Today", icon: IconSunHigh },
  { href: "/chronicle/tasks", label: "Tasks", icon: IconListDetails },
] as const;

/**
 * Top row of My Chronicle: the Today / Tasks switch (each tab has its own
 * URL) and "Create a habit" for the full form.
 */
export function ChronicleTabs() {
  const pathname = usePathname();
  // On one of the user's lists, a new habit starts in that list (the page checks it's theirs).
  const param = useSearchParams().get("list");
  const listId = pathname === "/chronicle/tasks" && param && param !== "all" ? param : null;
  const newHref = listId ? `/chronicle/new?list=${encodeURIComponent(listId)}` : "/chronicle/new";

  return (
    <div className="mb-6 flex items-center gap-2">
      <nav aria-label="My Chronicle" className="flex flex-1 gap-2 sm:flex-none">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 font-bold shadow-pop transition sm:flex-none sm:px-6 ${
                active ? "bg-tangerine text-white" : "bg-white text-slate-500 hover:text-ink"
              }`}
            >
              <tab.icon aria-hidden className="size-5" stroke={2.25} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <Link
        href={newHref}
        aria-label="Create a habit"
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-tangerine p-3 font-bold text-white shadow-pop transition hover:brightness-105 sm:px-5 sm:py-2.5"
      >
        <IconPlus aria-hidden className="size-5" stroke={3} />
        <span className="hidden sm:inline">Create a habit</span>
      </Link>
    </div>
  );
}
