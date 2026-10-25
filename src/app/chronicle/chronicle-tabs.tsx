"use client";

import { IconListDetails, IconSunHigh } from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/chronicle", label: "Today", icon: IconSunHigh },
  { href: "/chronicle/tasks", label: "Tasks", icon: IconListDetails },
] as const;

/** Today / Tasks switch at the top of My Chronicle. Each tab has its own URL. */
export function ChronicleTabs() {
  const pathname = usePathname();
  return (
    <nav aria-label="My Chronicle" className="mb-6 flex gap-2">
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
  );
}
