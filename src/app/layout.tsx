import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { Quicksand } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

// Self-hosted by next/font, so no request to Google from visitors.
// No `weight` list = the variable font, so weights like 630 work.
const quicksand = Quicksand({
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body className="flex min-h-dvh flex-col font-sans font-medium antialiased">
        <header className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 pt-4">
          <Link href="/diary" aria-label="Ruchintachi home">
            <Image
              src="/ruchintachi-logo.png"
              alt="Ruchintachi — Habit Planner & Tracker"
              width={874}
              height={672}
              priority
              className="h-16 w-auto md:h-20"
            />
          </Link>
          <NavBar />
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
        className="block h-10 w-full opacity-90 md:h-16"
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
      <div className="bg-tangerine/90 px-4 pt-2 pb-8">
        <p className="mx-auto max-w-5xl text-center text-xs text-white">
          Ruchintachi is an unofficial, non-commercial fan project, not
          affiliated with or endorsed by Nintendo. Tomodachi Life and its
          assets are © Nintendo. Sprite rips courtesy of The Spriters
          Resource contributors.
        </p>
      </div>
    </footer>
  );
}
