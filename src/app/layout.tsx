import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { M_PLUS_Rounded_1c } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-rounded",
});

export const metadata: Metadata = {
  title: "Ruchintachi — Habit Planner & Tracker",
  description: "A Tomodachi Life–inspired habit tracker. Keep your habits, fill your calendar with gifts.",
};

export const viewport: Viewport = {
  themeColor: "#ffe500",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={rounded.variable}>
      <body className="min-h-dvh font-sans antialiased">
        <header className="mx-auto flex max-w-5xl items-center justify-center px-4 pt-4 md:justify-between">
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

        <main className="mx-auto max-w-5xl px-4 pt-6 pb-28 md:pb-12">
          {children}
        </main>

        <footer className="mx-auto max-w-5xl px-4 pb-28 text-center text-xs text-ink/60 md:pb-8">
          Ruchintachi is an unofficial, non-commercial fan project, not
          affiliated with or endorsed by Nintendo. Tomodachi Life and its
          assets are © Nintendo. Sprite rips courtesy of The Spriters
          Resource contributors.
        </footer>
      </body>
    </html>
  );
}
