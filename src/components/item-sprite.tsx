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
  fill = false,
  className = "",
}: {
  item: Pick<Item, "name" | "category" | "sprite">;
  size: number; // px; with `fill`, only the image's intrinsic size
  fill?: boolean; // grow to the parent's size (the parent sets width and height)
  className?: string;
}) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    const Placeholder = placeholders[item.category];
    return (
      <span
        role="img"
        aria-label={item.name}
        style={fill ? undefined : { width: size, height: size }}
        className={`flex items-center justify-center rounded-full bg-sand text-caption ${fill ? "size-full" : ""} ${className}`}
      >
        <Placeholder aria-hidden className="size-3/5" stroke={2} />
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
      className={`object-contain [image-rendering:pixelated] ${fill ? "size-full" : ""} ${className}`}
    />
  );
}
