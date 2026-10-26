// The fixed set of habit icons. Habits store the key; the UI shows the emoji.

// The picker shows four per row, in this order: the first row is the most used.
export const HABIT_ICONS = {
  star: "⭐",
  important: "❗",
  book: "📚",
  heart: "💖",
  water: "💧",
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
} as const;

export type HabitIcon = keyof typeof HABIT_ICONS;

export function isHabitIcon(icon: string): icon is HabitIcon {
  return Object.hasOwn(HABIT_ICONS, icon);
}

/** The emoji for a stored icon key, or null when the habit has none. */
export function iconEmoji(icon: string | null): string | null {
  return icon !== null && isHabitIcon(icon) ? HABIT_ICONS[icon] : null;
}
