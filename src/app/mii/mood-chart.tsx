"use client";

import {
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { moods } from "@/components/mood-meter";
import { MOOD_LEVELS, MOOD_MAX, moodLevel } from "@/lib/mood";
import { shortDate, type MoodPoint } from "@/lib/mood-history";

// Faint bands of the five mood colours behind the line, Fuming at the bottom.
const bands = MOOD_LEVELS.map((level, i) => ({
  id: level.id,
  from: level.min,
  to: i === 0 ? MOOD_MAX : MOOD_LEVELS[i - 1].min,
}));

/** The Mii's end-of-day mood for each day in the range, today last (#26). */
export function MoodChart({ points }: { points: MoodPoint[] }) {
  return (
    <div className="h-56 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 12 }}>
          {bands.map((band) => (
            <ReferenceArea
              key={band.id}
              y1={band.from}
              y2={band.to}
              fill={`var(--color-mood-${band.id})`}
              fillOpacity={0.25}
              strokeOpacity={0}
              ifOverflow="hidden"
            />
          ))}
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fill: "var(--color-caption)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            interval="preserveStartEnd"
          />
          <YAxis domain={[0, MOOD_MAX]} hide />
          <Tooltip content={MoodTooltip} cursor={{ stroke: "var(--color-caption)", strokeDasharray: "4 4" }} />
          <Line
            dataKey="mood"
            type="monotone"
            stroke="var(--color-ink)"
            strokeWidth={3}
            dot={points.length <= 31 ? { r: 3, fill: "var(--color-ink)", strokeWidth: 0 } : false}
            activeDot={{ r: 6, fill: "white", stroke: "var(--color-ink)", strokeWidth: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MoodTooltip({ active, payload }: Pick<TooltipContentProps, "active" | "payload">) {
  const point = payload?.[0]?.payload as MoodPoint | undefined;
  if (!active || !point || point.mood === null) return null;
  return (
    <div className="rounded-2xl bg-white px-3 py-2 text-sm shadow-pop">
      <p className="text-caption">{point.today ? "Today (so far)" : shortDate(point.date)}</p>
      <p className="font-bold">
        {moods[moodLevel(point.mood)].label} · {point.mood}
      </p>
    </div>
  );
}
