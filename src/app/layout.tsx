import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { BackgroundButton } from "@/components/background-button";
import { FieldWarning } from "@/components/field-warning";
import { NavBar } from "@/components/nav-bar";
import { PageBackground } from "@/components/page-background";
import { getCurrentUser } from "@/lib/auth/session";
import { DEFAULT_BACKGROUND } from "@/lib/backgrounds";
import "./globals.css";

// Self-hosted by next/font, so no request to Google from visitors.
// No `weight` list = the variable font (200–1000), so any weight works.
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-rounded",
});

export const metadata: Metadata = {
  title: "Ruchintachi — Habit Planner & Tracker",
  description: "A Tomodachi Life–inspired habit tracker. Keep your habits, fill your calendar with gifts.",
};

export const viewport: Viewport = {
  themeColor: "#fcefc7",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={nunito.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <PageBackground background={user?.background ?? DEFAULT_BACKGROUND} />
        {/* Logo left, nav centred on one line; on phones the nav drops below. */}
        <header className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-3 px-4 pt-4 md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/chronicle"
            aria-label="Ruchintachi home"
            className="justify-self-start"
          >
            <Image
              src="/ruchintachi-logo.png"
              alt="Ruchintachi — Habit Planner & Tracker"
              width={874}
              height={672}
              priority
              className="h-18 w-auto md:h-28"
            />
          </Link>
          {user && <NavBar />}
          {user && (
            // Right of the navbar on desktop; top-right corner, beside the logo, on phones.
            <div className="absolute top-4 right-4 md:static md:justify-self-end">
              <BackgroundButton background={user.background} />
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-12">
          {children}
        </main>

        <WaveFooter />
        <FieldWarning />
      </body>
    </html>
  );
}

/**
 * Orange shoreline at the bottom of every page: one soft, shallow ripple,
 * like the Tomodachi Life: Living the Dream wallpapers. Stretched to the
 * page width, so phones see fewer, wider bumps.
 */
function WaveFooter() {
  return (
    <footer className="mt-auto">
      <svg
        aria-hidden
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        // -mb-px hides the hairline seam against the block below.
        className="-mb-px block h-6 w-full md:h-10"
      >
        <path
          className="fill-tangerine"
          d="M0 18 C 60 12, 90 8, 150 9 S 280 26, 380 24 S 520 10, 620 11 S 760 27, 860 25 S 1000 9, 1100 10 S 1260 24, 1340 21 S 1420 15, 1440 15 V40 H0 Z"
        />
      </svg>
      <div className="bg-tangerine px-4 pt-6 pb-6">
        <p className="mx-auto max-w-5xl text-center text-white">
          Crafted by <span className="text-lg font-black text-sunny">mayxbui</span>. <br></br>
          <span className="text-sm">Tomodachi Life and its assets are registered trademarks of © Nintendo Co., Ltd. Sprite rips courtesy of The Spriters Resource contributors. Item data from the community sheet by echocolat, phil_macrocheira and superspazzy.</span>
        </p>
      </div>
    </footer>
  );
}
