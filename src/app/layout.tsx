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

/** The footer's crest line, in a 1440×48 box. */
const WAVE =
  "M0 22 C 60 12, 90 6, 150 7 S 280 34, 380 32 S 520 8, 620 9 S 760 36, 860 34 S 1000 6, 1100 8 S 1260 32, 1340 28 S 1420 18, 1440 18";

/**
 * Orange shoreline at the bottom of every page: one soft, rolling wave,
 * like the Tomodachi Life: Living the Dream wallpapers. Stretched to the
 * page width, so phones see fewer, wider bumps.
 */
function WaveFooter() {
  return (
    <footer className="mt-auto">
      <svg
        aria-hidden
        viewBox="0 0 1440 48"
        preserveAspectRatio="none"
        // -mb-px hides the hairline seam against the block below.
        className="-mb-px block h-8 w-full md:h-14"
      >
        <path className="fill-tangerine" d={`${WAVE} V48 H0 Z`} />
        {/* Darker edge along the crest only; keeps its width when stretched. */}
        <path
          d={WAVE}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={3}
          className="stroke-tangerine-deep"
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
