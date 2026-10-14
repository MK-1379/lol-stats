import type { MatchItem } from "../api/types";

export type ScorePart = {
  label: string;
  value: number;
  weight: number;
  raw: string;
  target?: string;
};

export type ScoreBreakdown = {
  score: number;
  parts: ScorePart[];
};

const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

const oneDecimal = (value: number) => String(Math.round(value * 10) / 10);

export type ScoreInput = Pick<
  MatchItem,
  "durationSeconds" | "position" | "cs" | "visionScore" | "kda" | "deaths" | "assists" | "win"
>;

export function performanceScore(match: ScoreInput): ScoreBreakdown {
  const minutes = match.durationSeconds / 60;
  const isSupport = match.position === "UTILITY";
  const csPerMinute = match.cs / minutes;
  const visionPerMinute = match.visionScore / minutes;

  const parts: ScorePart[] = [
    {
      label: "KDA",
      value: clamp(match.kda / 5),
      weight: 0.35,
      raw: oneDecimal(match.kda),
      target: "5",
    },
    {
      label: "Muertes",
      value: clamp(1 - match.deaths / 10),
      weight: 0.15,
      raw: String(match.deaths),
      target: "0",
    },
    isSupport
      ? {
          label: "Visión",
          value: clamp(visionPerMinute / 2.5),
          weight: 0.3,
          raw: `${oneDecimal(visionPerMinute)}/min`,
          target: "2.5/min",
        }
      : {
          label: "Farmeo",
          value: clamp(csPerMinute / 9),
          weight: 0.25,
          raw: `${oneDecimal(csPerMinute)} CS/min`,
          target: "9 CS/min",
        },
    isSupport
      ? {
          label: "Asistencias",
          value: clamp(match.assists / 15),
          weight: 0.1,
          raw: String(match.assists),
          target: "15",
        }
      : {
          label: "Visión",
          value: clamp(visionPerMinute / 1.2),
          weight: 0.15,
          raw: `${oneDecimal(visionPerMinute)}/min`,
          target: "1.2/min",
        },
    {
      label: "Victoria",
      value: match.win ? 1 : 0,
      weight: 0.1,
      raw: match.win ? "Ganada" : "Perdida",
    },
  ];

  const total = parts.reduce((sum, part) => sum + part.value * part.weight, 0);
  return { score: Math.round(total * 100) / 10, parts };
}

export type ScoreLevel = 1 | 2 | 3 | 4;

export type ScoreTone = { text: string; label: string; level: ScoreLevel };

export function scoreTone(score: number): ScoreTone {
  if (score >= 8) return { text: "text-perf-4", label: "Excelente", level: 4 };
  if (score >= 6) return { text: "text-perf-3", label: "Buena", level: 3 };
  if (score >= 4) return { text: "text-ink", label: "Normal", level: 2 };
  return { text: "text-ink", label: "Floja", level: 1 };
}
