import Image from "next/image";

/** The game's gold coin, for coins anywhere in the app (#28). */
export function CoinIcon({ className = "size-5" }: { className?: string }) {
  return <Image src="/items/Treasure-GoldCoin.png" alt="" width={40} height={40} className={className} />;
}

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

/** The user's coin balance (#28). Private: never shown to friends. */
export function CoinPill({ coins }: { coins: number }) {
  return (
    <span
      data-hint="Coins from your habits"
      className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold shadow-pop"
    >
      <CoinIcon />
      {coins}
      <span className="sr-only">coins</span>
    </span>
  );
}
