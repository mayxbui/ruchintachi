// Page backgrounds players can pick in Settings (#43). Images live in public/backgrounds/.
export const backgrounds = [
  { id: "og", label: "Original", file: "/backgrounds/og.png" },
  { id: "beach", label: "Beach", file: "/backgrounds/beach.png" },
  { id: "bubble", label: "Bubbles", file: "/backgrounds/bubble.png" },
  { id: "cafe", label: "Café", file: "/backgrounds/cafe.png" },
  { id: "clover", label: "Clover", file: "/backgrounds/clover.png" },
  { id: "halloween", label: "Halloween", file: "/backgrounds/halloween.png" },
  { id: "jungle", label: "Jungle", file: "/backgrounds/jungle.png" },
  { id: "office", label: "Office", file: "/backgrounds/office.png" },
  { id: "pink", label: "Pink", file: "/backgrounds/pink.png" },
  { id: "river", label: "River", file: "/backgrounds/river.png" },
  { id: "runaway", label: "Runaway", file: "/backgrounds/runaway.png" },
  { id: "space", label: "Space", file: "/backgrounds/space.png" },
  { id: "stars", label: "Stars", file: "/backgrounds/stars.png" },
  { id: "sunset", label: "Sunset", file: "/backgrounds/sunset.png" },
  { id: "zashiki", label: "Zashiki", file: "/backgrounds/zashiki.png" },
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
