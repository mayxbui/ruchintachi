import { ItemSprite } from "@/components/item-sprite";
import type { InventoryGroup } from "@/lib/inventory";

/** Every item the user has collected, grouped by category, with duplicate counts (#18). */
export function InventoryGrid({ groups }: { groups: readonly InventoryGroup[] }) {
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl bg-white/80 p-6 text-center">
        Have complete days in a week to get a gift. It&apos;ll show up here! 🎁
      </p>
    );
  }
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`items-${group.category}`}>
          <h3 id={`items-${group.category}`} className="mb-3 text-lg">
            {group.label}
          </h3>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {group.items.map(({ item, quantity }) => (
              <li
                key={item.id}
                className="relative flex flex-col items-center gap-2 rounded-2xl bg-white p-2 text-center sm:p-3 shadow-pop"
              >
                {/* Shrinks to fit the narrower phone tiles. */}
                <ItemSprite item={item} size={80} className="h-auto max-w-full" />
                <span className="line-clamp-2 text-sm leading-tight">{item.name}</span>
                {quantity > 1 && (
                  <span
                    aria-label={`${quantity} owned`}
                    className="absolute top-1.5 right-1.5 rounded-full bg-tangerine px-2 text-sm font-black text-white"
                  >
                    ×{quantity}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
