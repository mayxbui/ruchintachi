// Page backgrounds players can pick in Settings (#43). Images live in public/backgrounds/.
export const backgrounds = [
  { id: "og", label: "Original", file: "/backgrounds/og.png" },
  { id: "beach", label: "Beach", file: "/backgrounds/beach.png" },
  { id: "blue", label: "Blue", file: "/backgrounds/blue.png" },
  { id: "bubble", label: "Bubbles", file: "/backgrounds/bubble.png" },
  { id: "cafe", label: "Café", file: "/backgrounds/cafe.png" },
  { id: "city", label: "City", file: "/backgrounds/city.png" },
  { id: "clover", label: "Clover", file: "/backgrounds/clover.png" },
  { id: "ducky", label: "Ducky", file: "/backgrounds/ducky.png" },
  { id: "ferris-wheel", label: "Ferris wheel", file: "/backgrounds/ferris-wheel.png" },
  { id: "halloween", label: "Halloween", file: "/backgrounds/halloween.png" },
  { id: "jungle", label: "Jungle", file: "/backgrounds/jungle.png" },
  { id: "news", label: "News", file: "/backgrounds/news.png" },
  { id: "office", label: "Office", file: "/backgrounds/office.png" },
  { id: "pink", label: "Pink", file: "/backgrounds/pink.png" },
  { id: "river", label: "River", file: "/backgrounds/river.png" },
  { id: "runaway", label: "Runaway", file: "/backgrounds/runaway.png" },
  { id: "sand", label: "Sand", file: "/backgrounds/sand.png" },
  { id: "space", label: "Space", file: "/backgrounds/space.png" },
  { id: "stars", label: "Stars", file: "/backgrounds/stars.png" },
  { id: "sunset", label: "Sunset", file: "/backgrounds/sunset.png" },
  { id: "wishing-well", label: "Wishing well", file: "/backgrounds/wishing-well.png" },
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
