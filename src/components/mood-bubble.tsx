// Mood names are tentative; see CLAUDE.md "Mood".
export const moods = [
  { id: "lovestruck", label: "Lovestruck", className: "bg-mood-lovestruck" },
  { id: "overjoyed", label: "Overjoyed", className: "bg-mood-overjoyed" },
  { id: "content", label: "Content", className: "bg-mood-content" },
  { id: "gloomy", label: "Gloomy", className: "bg-mood-gloomy" },
  { id: "fuming", label: "Fuming", className: "bg-mood-fuming" },
] as const;

export type MoodId = (typeof moods)[number]["id"];

/** Tomodachi-style thought bubble: big circle with two small trailing dots. */
export function MoodBubble({ mood }: { mood: MoodId }) {
  const { label, className } = moods.find((m) => m.id === mood)!;
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className="relative">
        <div
          className={`flex size-16 items-center justify-center rounded-full border-5 border-white shadow-pop ${className}`}
        />
        <span
          className={`absolute -bottom-1 -left-1 size-4 rounded-full border-3 border-white ${className}`}
        />
        <span
          className={`absolute -bottom-3 -left-3 size-2 rounded-full ${className}`}
        />
      </div>
      <figcaption className="mt-2 text-base font-bold">{label}</figcaption>
    </figure>
  );
}
