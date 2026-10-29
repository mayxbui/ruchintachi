import type { ReactNode } from "react";
import { rateTone } from "@/lib/completion-rate";

const tones = {
  low: "var(--color-mood-fuming)",
  mid: "var(--color-mood-content)",
  high: "var(--color-leaf)",
};

/**
 * A round progress ring (#24): a sand track, filled clockwise from the top
 * in red, yellow or green by `percent`. Null means nothing was scheduled,
 * shown as a dashed ring with a dash, not as 0%.
 */
export function ProgressRing({
  percent,
  size,
  stroke,
  children,
}: {
  percent: number | null;
  size: number;
  stroke: number;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="white"
          stroke="var(--color-sand-deep)"
          strokeWidth={stroke}
          strokeDasharray={percent === null ? `${stroke * 0.6} ${stroke * 0.9}` : undefined}
        />
        {percent !== null && percent > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tones[rateTone(percent)]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(percent / 100) * circumference} ${circumference}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
}
