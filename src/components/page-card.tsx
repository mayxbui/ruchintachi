import type { ReactNode } from "react";

// Border colours a page can use; sunny (the logo) unless the page has its own.
const borders = {
  sunny: "border-sunny",
  sky: "border-sky", // Calendar, matching its nav pill
} as const;

/** Rounded white card used as the main panel on every page. */
export function PageCard({
  title,
  border = "sunny",
  children,
}: {
  title: string;
  border?: keyof typeof borders;
  children: ReactNode;
}) {
  return (
    <section className={`rounded-blob border-6 ${borders[border]} bg-cream/90 p-6 shadow-pop`}>
      <h1 className="mb-4 text-3xl">{title}</h1>
      {children}
    </section>
  );
}
