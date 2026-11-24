import type { CoachDirection, CoachMetric } from "../api/types";

function signed(text: string, value: number) {
  return value > 0 ? `+${text}` : text;
}

export function formatCoachValue(metric: CoachMetric, value: number) {
  switch (metric) {
    case "killParticipation":
      return `${Math.round(value * 100)}%`;
    case "visionPerMinute":
      return value.toFixed(2);
    case "csDiffPerMinute":
      return `${signed(value.toFixed(1), value)}/min`;
    case "goldDiff":
      return signed(String(Math.round(value)), value);
    default:
      return value.toFixed(1);
  }
}

export function formatCoachTarget(metric: CoachMetric, direction: CoachDirection, target: number) {
  return `${direction === "higher" ? "≥" : "≤"} ${formatCoachValue(metric, target)}`;
}
