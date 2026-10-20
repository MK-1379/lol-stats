import { hexagonFill, hexagonPoints } from "../../utils/hexagon";
import type { ScoreLevel } from "../../utils/score";

const FILL: Record<ScoreLevel, string> = {
  1: "fill-perf-1",
  2: "fill-perf-2",
  3: "fill-perf-3",
  4: "fill-perf-4",
};

const STROKE: Record<ScoreLevel, string> = {
  1: "stroke-perf-1",
  2: "stroke-perf-2",
  3: "stroke-perf-3",
  4: "stroke-perf-4",
};

type ScoreBadgeProps = {
  score: number;
  level: ScoreLevel;
  className?: string;
};

export function ScoreBadge({ score, level, className = "size-6" }: ScoreBadgeProps) {
  const fill = hexagonFill(score / 10);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 32 32"
      className={`shrink-0 overflow-visible ${level === 4 ? "motion-safe:animate-flare" : ""} ${className}`}
    >
      <polygon points={hexagonPoints()} className="fill-panel-2" />
      {fill.length > 0 && (
        <polygon
          points={hexagonPoints(fill)}
          className={`origin-bottom [transform-box:fill-box] motion-safe:animate-fill-up ${FILL[level]}`}
        />
      )}
      <polygon
        points={hexagonPoints()}
        className={`fill-none ${STROKE[level]}`}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}
