"use client";

import type { ReactElement } from "react";
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
        <LineChart data={points} margin={{ top: 18, right: 20, bottom: 0, left: 12 }}>
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
            stroke="var(--color-caption)"
            strokeWidth={3.5}
            strokeLinecap="round"
            dot={(props: DotProps) => <MoodDot {...props} small={points.length > 31} />}
            activeDot={(props: DotProps) => <MoodDot {...props} active />}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface DotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: MoodPoint;
}

/**
 * A day's dot, filled with that day's mood colour and ringed in white like
 * the meter's face. Today wears the face itself; long ranges get small dots.
 */
function MoodDot({
  cx,
  cy,
  index,
  payload,
  small,
  active,
}: DotProps & { small?: boolean; active?: boolean }): ReactElement {
  const key = `dot-${index}`;
  if (cx === undefined || cy === undefined || payload?.mood == null) return <g key={key} />;
  const level = moodLevel(payload.mood);
  const { Face } = moods[level];
  const fill = `var(--color-mood-${level})`;
  if (payload.today) {
    const r = active ? 15 : 13;
    return (
      <g key={key}>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke="white" strokeWidth={3} />
        <Face x={cx - r + 3} y={cy - r + 3} width={2 * r - 6} height={2 * r - 6} stroke={2} color="var(--color-ink)" />
      </g>
    );
  }
  const r = active ? 8 : small ? 3.5 : 5.5;
  return (
    <circle
      key={key}
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={active ? "var(--color-caption)" : "white"}
      strokeWidth={small && !active ? 1.5 : 2.5}
    />
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
