import { IconCheck } from "@tabler/icons-react";

export function RoundCheck({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex size-6 shrink-0 items-center justify-center rounded-full border-3 border-leaf text-white transition peer-focus-visible:ring-4 peer-focus-visible:ring-sky ${checked ? "bg-leaf" : "bg-white"}`}
    >
      {checked && <IconCheck className="size-4" stroke={3.5} />}
    </span>
  );
}
