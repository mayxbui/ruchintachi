"use client";

import { IconApple, IconBallBaseball, IconDiamond, IconShirt } from "@tabler/icons-react";
import Image from "next/image";
import { useState } from "react";
import type { Item, ItemCategory } from "@/lib/items";

const placeholders: Record<ItemCategory, typeof IconApple> = {
  food: IconApple,
  goods: IconBallBaseball,
  treasure: IconDiamond,
  clothing: IconShirt,
};

/**
 * An item's sprite from public/items/. Until that sprite has been added (or
 * if it fails to load) a category icon stands in, so a missing file never
 * shows a broken image. Used by the gift reveal, calendar and inventory.
 */
export function ItemSprite({
  item,
  size,
  className = "",
}: {
  item: Pick<Item, "name" | "category" | "sprite">;
  size: number; // px
  className?: string;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    const Placeholder = placeholders[item.category];
    return (
      <span
        role="img"
        aria-label={item.name}
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-full bg-sand text-caption ${className}`}
      >
        <Placeholder aria-hidden style={{ width: size * 1, height: size * 1 }} stroke={2} />
      </span>
    );
  }
  return (
    <Image
      src={item.sprite}
      alt={item.name}
      width={size}
      height={size}
      // Already shrunk to 128px WebP by `pnpm sprites:build`; serve as-is.
      unoptimized
      onError={() => setMissing(true)}
      className={`object-contain ${className}`}
    />
  );
}
