// The fixed set of habit icons. Habits store the key; the UI shows the emoji.

export const HABIT_ICONS = {
  star: "⭐",
  water: "💧",
  book: "📚",
  run: "🏃",
  stretch: "🧘",
  sleep: "😴",
  food: "🥗",
  pill: "💊",
  tooth: "🪥",
  clean: "🧹",
  plant: "🌱",
  music: "🎵",
  art: "🎨",
  study: "✏️",
  heart: "💖",
  sun: "☀️",
} as const;

export type HabitIcon = keyof typeof HABIT_ICONS;

export function isHabitIcon(icon: string): icon is HabitIcon {
  return Object.hasOwn(HABIT_ICONS, icon);
}

/** The emoji for a stored icon key; unknown keys fall back to the star. */
export function iconEmoji(icon: string): string {
  return isHabitIcon(icon) ? HABIT_ICONS[icon] : HABIT_ICONS.star;
}
