import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { ItemSprite } from "@/components/item-sprite";
import { PageCard } from "@/components/page-card";
import { db } from "@/db";
import { listInventory } from "@/db/inventory";
import { requireUser } from "@/lib/auth/session";
import { groupInventory, inventoryTotals } from "@/lib/inventory";

/** Every item the user has collected, grouped by category, with duplicate counts (#18). */
export default async function InventoryPage() {
  const user = await requireUser();
  const groups = groupInventory(listInventory(db, user.id));
  const { total, kinds } = inventoryTotals(groups);

  return (
    <PageCard title="My items" border="pink">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-caption">
          {total === 0
            ? "No items yet."
            : `${total} item${total === 1 ? "" : "s"}, ${kinds} different`}
        </p>
        <Link
          href="/mii"
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-caption transition hover:bg-sand hover:text-ink"
        >
          <IconArrowLeft aria-hidden className="size-6" stroke={2.25} />
          Back to Mii
        </Link>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-2xl bg-white/80 p-6 text-center">
          Finish every task on a day to get a gift. It&apos;ll show up here! 🎁
        </p>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`items-${group.category}`}>
              <h2 id={`items-${group.category}`} className="mb-3 text-xl">
                {group.label}
              </h2>
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
      )}
    </PageCard>
  );
}
