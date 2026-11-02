"use client";

import { useState, useTransition } from "react";
import { FormMessage } from "@/components/form";
import { REPAIR_COST } from "@/lib/coins";
import { buyRepairAction } from "./actions";
import { CoinIcon } from "@/components/stat-pills";

/**
 * Streak repair offer (#82): yesterday was missed, and coins can buy it back
 * until today ends. The button is disabled, showing the balance, when the
 * user can't afford it.
 */
export function RepairBanner({ streak, coins }: { streak: number; coins: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const short = coins < REPAIR_COST;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-light-sky/40 px-4 py-3 shadow-pop">
      <p className="min-w-0 flex-1">
        <span aria-hidden>🩹 </span>
        You missed yesterday. Repair it before today ends to keep your{" "}
        <strong>{streak}-day streak</strong>.
      </p>
      <button
        type="button"
        disabled={short || pending}
        onClick={() =>
          startTransition(async () => {
            setError(undefined);
            const result = await buyRepairAction();
            if (result.error) setError(result.error);
          })
        }
        className="flex shrink-0 items-center gap-1 bg-tangerine px-4 py-2 font-bold text-white disabled:opacity-60"
      >
        Repair for <CoinIcon /> {REPAIR_COST}
      </button>
      {short && (
        <p className="w-full text-sm text-caption">
          You have {coins} coin{coins === 1 ? "" : "s"}. Finish your habits to earn more.
        </p>
      )}
      {error && (
        <div className="w-full">
          <FormMessage error={error} />
        </div>
      )}
    </div>
  );
}
