import type { ReactNode } from "react";

/** Rounded white card used as the main panel on every page. */
export function PageCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-blob border-4 border-sunny bg-white/85 p-6 shadow-pop">
      <h1 className="mb-4 text-2xl">{title}</h1>
      {children}
    </section>
  );
}
