import type { ReactNode } from "react";

// Border colours a page can use; sunny (the logo) unless the page has its own.
const borders = {
  sunny: "border-sunny",
  sky: "border-sky", // Calendar, matching its nav pill
  pink: "border-light-pink",
  cherry: "border-light-cherry",
} as const;

/** Rounded white card used as the main panel on every page. */
export function PageCard({
  title,
  border = "cherry",
  children,
}: {
  title: string;
  border?: keyof typeof borders;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-blob border-4 ${borders[border]} bg-cream/90 p-4 shadow-pop sm:border-6 sm:p-6`}>
      <h1 className="mb-3 text-2xl sm:mb-4 sm:text-3xl">{title}</h1>
      {children}
    </section>
  );
}
