"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/diary", label: "My Diary" },
  { href: "/calendar", label: "Calendar" },
  { href: "/town", label: "Town" },
  { href: "/mii", label: "Mii" },
  { href: "/settings", label: "Settings" },
] as const;

/** Top pill bar; the active tab is a bold orange pill. Scrolls sideways on narrow phones. */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="w-full max-w-full overflow-x-auto rounded-full bg-white/85 p-1 shadow-pop sm:p-1.5 [scrollbar-width:none] md:w-auto"
    >
      <ul className="flex min-w-max justify-between gap-0 sm:gap-1 md:gap-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-full px-2 py-2 text-[13px] font-bold whitespace-nowrap transition sm:px-4 sm:text-sm md:px-6 md:text-base ${
                  active
                    ? "bg-tangerine/90 text-white shadow-pop"
                    : "text-slate-500 hover:bg-white/85 hover:text-ink hover:shadow-pop"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
