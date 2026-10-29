"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Pages shown without the site's header and footer, e.g. the pop-out widget (#65). */
const BARE_PATHS = ["/widget"];

/** Renders its (server-rendered) children everywhere except the bare pages. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return BARE_PATHS.includes(usePathname()) ? null : children;
}
