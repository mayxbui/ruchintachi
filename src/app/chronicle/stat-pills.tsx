/** Current streak (#35): complete days in a row. Private to the owner. */
export function StreakPill({ streak }: { streak: number }) {
  return (
    <span
      data-hint="Days in a row with every habit done"
      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold shadow-pop"
    >
      <span aria-hidden>🔥</span>
      {streak}
      <span className="sr-only">-day streak</span>
    </span>
  );
}
