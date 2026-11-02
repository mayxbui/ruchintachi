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

// Fuming to Lovestruck, each with its share of the 0–100 score.
const SEGMENTS = [...MOOD_LEVELS].reverse().map((level, i, all) => ({
  id: level.id,
  min: level.min,
  max: i === all.length - 1 ? MOOD_MAX : all[i + 1].min,
}));

/**
 * Your mood (#25): five rounded segments, Fuming to Lovestruck, each as wide
 * as its band of the 0–100 score, with a round face bobbing at the current
 * score inside its segment.
 */
export function MoodMeter({ score }: { score: number }) {
  const value = clampMood(score);
  const level = moodLevel(value);
  const { label, className, Face } = moods[level];
  return (
    <div
      role="meter"
      aria-label="Mood"
      aria-valuemin={0}
      aria-valuemax={MOOD_MAX}
      aria-valuenow={value}
      aria-valuetext={label}
      className="flex gap-1.5 py-6 sm:gap-2"
    >
      {SEGMENTS.map((segment, i) => {
        const { Face: SegmentFace, className: colour, label: name } = moods[segment.id];
        const active = segment.id === level;
        // Where the score sits within this segment; a full bar puts it at the end.
        const at = Math.min(100, ((value - segment.min) / (segment.max - segment.min)) * 100);
        const left =
          i === 0
            ? `max(1.5rem, ${at}%)`
            : i === SEGMENTS.length - 1
              ? `min(calc(100% - 1.5rem), ${at}%)`
              : `${at}%`;
        return (
          <div
            key={segment.id}
            className="relative"
            style={{ flexGrow: segment.max - segment.min, flexBasis: 0 }}
            data-hint={name}
          >
            <div
              className={`flex h-8 items-center justify-center rounded-full border-3 border-white shadow-pop ${colour} ${
                active ? "" : "opacity-70"
              }`}
            >
              <SegmentFace aria-hidden className="size-5 text-ink/40" stroke={2} />
            </div>
            {active && (
              <div
                className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left }}
              >
                <div
                  className={`flex size-12 sm:size-15 animate-mood-bob items-center justify-center rounded-full border-4 border-white text-ink shadow-pop ${className}`}
                >
                  <Face aria-hidden className="size-9 sm:size-11" stroke={1.75} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
