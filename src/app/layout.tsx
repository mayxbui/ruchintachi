import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { BackgroundButton } from "@/components/background-button";
import { SignOutButton } from "@/components/sign-out-button";
import { FieldWarning } from "@/components/field-warning";
import { HoverHint } from "@/components/hover-hint";
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
  title: "RuchinDachi — Habit Planner & Tracker",
  description: "A Tomodachi Life–inspired habit tracker. Keep your habits, fill your calendar with gifts.",
};

export const viewport: Viewport = {
  themeColor: "#fcefc7",
  // Lets the fixed background run under the notch and iOS Safari's toolbar.
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="en" className={nunito.variable}>
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <PageBackground background={user?.background ?? DEFAULT_BACKGROUND} />
        {/* Logo left, nav centred on one line; on phones the nav floats at the bottom of the screen. */}
        <header className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-3 px-3 pt-3 sm:px-4 sm:pt-4 md:grid-cols-[1fr_auto_1fr]">
          <Link
            href="/chronicle"
            aria-label="RuchinDachi home"
            className="justify-self-start"
          >
            <Image
              src="/ruchintachi-logo.webp"
              alt="RuchinDachi — Habit Planner & Tracker"
              width={798}
              height={615}
              priority
              className="h-14 w-auto sm:h-18 md:h-28"
            />
          </Link>
          {user && <NavBar />}
          {user && (
            // Just right of the navbar on desktop; top-right corner, beside the logo, on phones.
            <div className="absolute top-3 right-3 flex gap-2 sm:top-4 sm:right-4 md:static md:justify-self-start">
              <BackgroundButton background={user.background} />
              <SignOutButton />
            </div>
          )}
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-3 pt-4 pb-10 sm:px-4 sm:pt-6 sm:pb-12">
          {children}
        </main>

        <WaveFooter />
        <FieldWarning />
        <HoverHint />
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
      {/* Extra room on phones so the floating navbar doesn't cover the text. */}
      <div className="bg-tangerine px-4 pb-28 md:pb-6">
        <p className="mx-auto max-w-5xl text-center text-sm text-white sm:text-lg">
          Crafted by <span className="text-base font-black text-sunny sm:text-lg">mayxbui</span>. <br></br>
          <span className="text-xs sm:text-sm">Tomodachi Life and its assets are registered trademarks of © Nintendo Co., Ltd. Sprite rips courtesy of The Spriters Resource contributors. Item icons from tlmodding/ltd-images. Item data from the community sheet by echocolat, phil_macrocheira and superspazzy.</span>
        </p>
      </div>
    </footer>
  );
}
