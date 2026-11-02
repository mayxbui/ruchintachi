import Image from "next/image";

const pillClass =
  "flex h-11 shrink-0 items-center gap-1 rounded-2xl bg-cream/90 px-2.5 text-sm font-black shadow-pop sm:text-base";

/** The game's gold coin, for coins anywhere in the app (#28). */
export function CoinIcon({ className = "size-5" }: { className?: string }) {
  return <Image src="/items/Treasure-GoldCoin.png" alt="" width={40} height={40} className={className} />;
}

/** The rubber duck: the streak's icon and the Calendar's stamp on complete days. */
export function DuckIcon({ className = "size-6" }: { className?: string }) {
  return <Image src="/items/Treasure040.png" alt="" width={48} height={48} className={className} />;
}

/**
 * The user's current streak (#35) and coin balance (#28), side by side.
 * Private to the owner; shown in the header and the pop-out widget.
 */
export function StatPills({ streak, coins, className = "" }: { streak: number; coins: number; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span data-hint="Streak" className={pillClass}>
        <DuckIcon />
        {streak}
        <span className="sr-only">-day streak</span>
      </span>
      <span data-hint="Coins" className={pillClass}>
        <CoinIcon />
        {coins}
        <span className="sr-only">coins</span>
      </span>
    </div>
  );
}
