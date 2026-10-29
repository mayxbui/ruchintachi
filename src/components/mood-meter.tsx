import {
  IconMoodAngry,
  IconMoodHappy,
  IconMoodHeart,
  IconMoodSad,
  IconMoodSmile,
} from "@tabler/icons-react";
import { MOOD_MAX, clampMood, moodLevel, type MoodLevel } from "@/lib/mood";

// Mood names are tentative; see CLAUDE.md "Mood".
export const moods = {
  lovestruck: { label: "Lovestruck", className: "bg-mood-lovestruck", Face: IconMoodHeart },
  overjoyed: { label: "Overjoyed", className: "bg-mood-overjoyed", Face: IconMoodHappy },
  content: { label: "Content", className: "bg-mood-content", Face: IconMoodSmile },
  gloomy: { label: "Gloomy", className: "bg-mood-gloomy", Face: IconMoodSad },
  fuming: { label: "Fuming", className: "bg-mood-fuming", Face: IconMoodAngry },
} satisfies Record<MoodLevel, unknown>;

// Fuming to Lovestruck, blending into each other. Each colour peaks near the
// middle of its band, and Content's yellow sits at 50 (the starting mood), so
// a new Mii's face starts in the centre of the bar.
const GRADIENT = `linear-gradient(to right, ${[
  "var(--color-mood-fuming) 0%",
  "var(--color-mood-gloomy) 30%",
  "var(--color-mood-content) 50%",
  "var(--color-mood-overjoyed) 75%",
  "var(--color-mood-lovestruck) 100%",
].join(", ")})`;

/**
 * The Mii's mood (#25): a bar of the five mood colours, Fuming to Lovestruck,
 * with a round face sitting at the current 0–100 score.
 */
export function MoodMeter({ score }: { score: number }) {
  const value = clampMood(score);
  const { label, className, Face } = moods[moodLevel(value)];
  return (
    <div
      role="meter"
      aria-label="Mii mood"
      aria-valuemin={0}
      aria-valuemax={MOOD_MAX}
      aria-valuenow={value}
      aria-valuetext={label}
      className="relative py-5"
    >
      <div
        className="h-7 rounded-full border-4 border-white shadow-pop"
        style={{ backgroundImage: GRADIENT }}
      />
      {/* Kept a face's half-width from either end so it never hangs off the bar. */}
      <div
        className={`absolute top-1/2 flex size-15 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-ink shadow-pop ${className}`}
        style={{ left: `clamp(1.875rem, ${value}%, calc(100% - 1.875rem))` }}
      >
        <Face aria-hidden className="size-11" stroke={1.75} />
      </div>
    </div>
  );
}
