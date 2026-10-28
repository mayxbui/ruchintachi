import {
  IconMoodAngry,
  IconMoodHappy,
  IconMoodHeart,
  IconMoodSad,
  IconMoodSmile,
} from "@tabler/icons-react";
import { MOOD_LEVELS, MOOD_MAX, clampMood, moodLevel, type MoodLevel } from "@/lib/mood";

// Mood names are tentative; see CLAUDE.md "Mood".
export const moods = {
  lovestruck: { label: "Lovestruck", className: "bg-mood-lovestruck", Face: IconMoodHeart },
  overjoyed: { label: "Overjoyed", className: "bg-mood-overjoyed", Face: IconMoodHappy },
  content: { label: "Content", className: "bg-mood-content", Face: IconMoodSmile },
  gloomy: { label: "Gloomy", className: "bg-mood-gloomy", Face: IconMoodSad },
  fuming: { label: "Fuming", className: "bg-mood-fuming", Face: IconMoodAngry },
} satisfies Record<MoodLevel, unknown>;

// The bar's sections, worst to best, each as wide as its band of scores.
const sections = [...MOOD_LEVELS].reverse().map((level, i, all) => ({
  id: level.id,
  width: (all[i + 1]?.min ?? MOOD_MAX) - level.min,
}));

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
      className="relative py-4"
    >
      <div className="flex h-4 overflow-hidden rounded-full border-3 border-white shadow-pop">
        {sections.map(({ id, width }) => (
          <div key={id} className={moods[id].className} style={{ flexGrow: width }} />
        ))}
      </div>
      {/* Kept a face's half-width from either end so it never hangs off the bar. */}
      <div
        className={`absolute top-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-white text-ink shadow-pop ${className}`}
        style={{ left: `clamp(1.5rem, ${value}%, calc(100% - 1.5rem))` }}
      >
        <Face aria-hidden className="size-9" stroke={1.75} />
      </div>
    </div>
  );
}
