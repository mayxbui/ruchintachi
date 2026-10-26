"use client";

import { useOptimistic, useTransition } from "react";
import { IconPicker } from "@/components/icon-picker";
import { isHabitIcon, type HabitIcon } from "@/lib/habit-icons";
import { setIconAction } from "./actions";

/** A task row's icon: click to pick another (or none). Saves at once. */
export function TaskIcon({ habitId, icon, name }: { habitId: string; icon: string | null; name: string }) {
  const [shown, setShown] = useOptimistic<HabitIcon | null>(icon && isHabitIcon(icon) ? icon : null);
  const [, startTransition] = useTransition();

  function change(next: HabitIcon | null) {
    startTransition(async () => {
      setShown(next);
      await setIconAction(habitId, next); // on error the server's icon comes back
    });
  }

  return <IconPicker value={shown} onChange={change} size="sm" label={name} />;
}
