import type { MatchItem } from "../api/types";

export type ScoreBreakdown = {
  score: number;
  parts: { label: string; value: number; weight: number }[];
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export type ScoreInput = Pick<
  MatchItem,
  "durationSeconds" | "position" | "cs" | "visionScore" | "kda" | "deaths" | "assists" | "win"
>;

export function performanceScore(match: ScoreInput): ScoreBreakdown {
  const minutes = match.durationSeconds / 60;
  const isSupport = match.position === "UTILITY";
  const csPerMinute = match.cs / minutes;
  const visionPerMinute = match.visionScore / minutes;

  const parts = [
    { label: "KDA", value: clamp(match.kda / 5), weight: 0.35 },
    { label: "Muertes", value: clamp(1 - match.deaths / 10), weight: 0.15 },
    isSupport
      ? { label: "Visión", value: clamp(visionPerMinute / 2.5), weight: 0.3 }
      : { label: "Farmeo", value: clamp(csPerMinute / 9), weight: 0.25 },
    isSupport
      ? { label: "Asistencias", value: clamp(match.assists / 15), weight: 0.1 }
      : { label: "Visión", value: clamp(visionPerMinute / 1.2), weight: 0.15 },
    { label: "Victoria", value: match.win ? 1 : 0, weight: 0.1 },
  ];

  const total = parts.reduce((sum, part) => sum + part.value * part.weight, 0);
  return { score: Math.round(total * 100) / 10, parts };
}

export function scoreTone(score: number) {
  if (score >= 8) return { text: "text-kda-high", label: "Excelente" };
  if (score >= 6) return { text: "text-kda-mid", label: "Buena" };
  if (score >= 4) return { text: "text-ink", label: "Normal" };
  return { text: "text-muted", label: "Floja" };
}
