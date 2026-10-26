// Page backgrounds players can pick in Settings (#43). Images live in public/.
export const backgrounds = [
  { id: "og", label: "Original", file: "/bg-og.png" },
  { id: "beach", label: "Beach", file: "/bg-beach.png" },
  { id: "bubble", label: "Bubbles", file: "/bg-bubble.png" },
  { id: "cafe", label: "Café", file: "/bg-cafe.png" },
  { id: "clover", label: "Clover", file: "/bg-clover.png" },
  { id: "halloween", label: "Halloween", file: "/bg-halloween.png" },
  { id: "jungle", label: "Jungle", file: "/bg-jungle.png" },
  { id: "office", label: "Office", file: "/bg-office.png" },
  { id: "pink", label: "Pink", file: "/bg-pink.png" },
  { id: "river", label: "River", file: "/bg-river.png" },
  { id: "runaway", label: "Runaway", file: "/bg-runaway.png" },
  { id: "space", label: "Space", file: "/bg-space.png" },
  { id: "stars", label: "Stars", file: "/bg-stars.png" },
  { id: "sunset", label: "Sunset", file: "/bg-sunset.png" },
  { id: "zashiki", label: "Zashiki", file: "/bg-zashiki.png" },
] as const;

export type BackgroundId = (typeof backgrounds)[number]["id"];

export const backgroundIds = backgrounds.map((b) => b.id) as [BackgroundId, ...BackgroundId[]];

export const DEFAULT_BACKGROUND: BackgroundId = "og";

export function isBackgroundId(value: unknown): value is BackgroundId {
  return typeof value === "string" && backgroundIds.includes(value as BackgroundId);
}

/** The background to show; unknown ids fall back to the default. */
export function backgroundFor(id: string | null | undefined) {
  return backgrounds.find((b) => b.id === id) ?? backgrounds[0];
}
