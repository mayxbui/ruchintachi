"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/diary", label: "My Diary", icon: "📔" },
  { href: "/calendar", label: "Calendar", icon: "📅" },
  { href: "/town", label: "Town", icon: "🏘️" },
  { href: "/mii", label: "Mii", icon: "🙂" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
] as const;

/** Bottom tab bar on phones, inline row in the header on desktop. */
export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-sunny-deep bg-sunny md:static md:border-0 md:bg-transparent"
    >
      <ul className="mx-auto flex max-w-md justify-around md:max-w-none md:justify-end md:gap-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-bold transition md:flex-row md:gap-2 md:px-4 md:text-sm ${
                  active
                    ? "bg-white text-ink shadow-pop"
                    : "text-ink/70 hover:bg-white/60 hover:text-ink"
                }`}
              >
                <span aria-hidden className="text-xl md:text-base">
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
