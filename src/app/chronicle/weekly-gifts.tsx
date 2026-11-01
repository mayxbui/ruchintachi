"use client";

import { useState } from "react";
import { revealWeeklyGiftAction } from "./actions";
import { GiftReveal, type GiftItem } from "./gift-reveal";

/**
 * Plays the reveal for each weekly gift not yet seen (#27), one after
 * another, oldest first. Closing one marks it revealed so it plays once.
 */
export function WeeklyGifts({ gifts }: { gifts: { weekStartDate: string; note: string; item: GiftItem }[] }) {
  const [index, setIndex] = useState(0);
  const gift = gifts[index];
  if (!gift) return null;
  return (
    <GiftReveal
      key={gift.weekStartDate}
      gift={gift.item}
      note={gift.note}
      onClose={() => {
        void revealWeeklyGiftAction(gift.weekStartDate);
        setIndex((i) => i + 1);
      }}
    />
  );
}
