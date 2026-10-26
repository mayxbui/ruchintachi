import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Nunito } from "next/font/google";
import { BackgroundButton } from "@/components/background-button";
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
      </body>
    </html>
  );
}

/** Orange shoreline at the bottom of every page. */
function WaveFooter() {
  return (
    <footer className="mt-auto">
      <svg
        aria-hidden
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-10 w-full md:h-16"
      >
        <path
          className="fill-tangerine-light"
          d="M0 40 C 180 5, 360 5, 540 35 S 900 75, 1080 40 S 1320 0, 1440 25 V80 H0 Z"
        />
        <path
          className="fill-tangerine"
          d="M0 60 C 200 30, 380 30, 600 55 S 960 85, 1180 55 S 1380 35, 1440 50 V80 H0 Z"
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
