import * as llmClient from "../ai/llmClient.js";
import { env } from "../config/env.js";
import { HttpError } from "../middlewares/errorHandler.js";
import { getCoachReport } from "./coachService.js";

type CoachReport = Awaited<ReturnType<typeof getCoachReport>>;

type CoachSummary = {
  text: string;
  generatedAt: string;
  model: string;
};

export const SYSTEM_INSTRUCTION = [
  "Eres un entrenador de League of Legends. Hablas en español de España, de tú, con un tono directo y motivador.",
  "Recibes en JSON un informe con las estadísticas de un jugador, ya calculadas por su aplicación.",
  "Escribe tres párrafos cortos, con 120 palabras como máximo en total:",
  "1) cómo está jugando en general y qué hace bien;",
  "2) en qué debe centrarse y por qué, usando la diferencia entre victorias y derrotas;",
  "3) el objetivo de la semana explicado como un reto concreto.",
  "Usa solo los datos del informe y no inventes cifras ni campeones.",
  "Copia las cifras tal y como vienen en el informe, con sus unidades.",
  "No hables de rachas: el informe no dice nada sobre victorias seguidas.",
  "Escribe texto plano: sin markdown, sin listas y sin emojis.",
].join("\n");

const CACHE_TIME_ZONE = "Europe/Madrid";

let cache: { day: string; summary: CoachSummary } | null = null;
let pending: Promise<CoachSummary> | null = null;

export function clearCoachSummaryCache() {
  cache = null;
  pending = null;
}

export function todayKey(now = new Date()) {
  return now.toLocaleDateString("sv-SE", { timeZone: CACHE_TIME_ZONE });
}

function formatForPrompt(metric: string, value: number | null) {
  if (value === null) {
    return "sin datos";
  }
  if (metric === "killParticipation") {
    return `${Math.round(value * 100)} %`;
  }
  return String(Math.round(value * 10) / 10).replace(".", ",");
}

export function buildCoachPrompt(report: CoachReport) {
  const readable = {
    posicion: report.position,
    partidasAnalizadas: report.gamesAnalyzed,
    porcentajeVictorias: `${report.winrate} %`,
    aMejorar: report.tips.map((tip) => ({
      metrica: tip.label,
      tuMedia: formatForPrompt(tip.metric, tip.value),
      objetivo: formatForPrompt(tip.metric, tip.target),
      enVictorias: formatForPrompt(tip.metric, tip.inWins),
      enDerrotas: formatForPrompt(tip.metric, tip.inLosses),
    })),
    puntosFuertes: report.strengths.map((strength) => ({
      metrica: strength.label,
      tuMedia: formatForPrompt(strength.metric, strength.value),
    })),
    objetivoSemanal: report.weeklyGoal && {
      metrica: report.weeklyGoal.label,
      objetivo: formatForPrompt(report.weeklyGoal.metric, report.weeklyGoal.target),
      partidasNecesarias: report.weeklyGoal.requiredHits,
      deCuantas: report.weeklyGoal.outOf,
      cumplidasAhora: report.weeklyGoal.currentHits,
    },
  };
  return `Informe del jugador:\n${JSON.stringify(readable, null, 2)}`;
}

async function generateSummary(): Promise<CoachSummary> {
  const report = await getCoachReport(20);

  try {
    const text = await llmClient.generateText(SYSTEM_INSTRUCTION, buildCoachPrompt(report));
    if (!text) {
      throw new Error("Respuesta vacía");
    }
    return { text, generatedAt: new Date().toISOString(), model: env.AI_MODEL };
  } catch (error) {
    console.error("[coach] La IA falló:", error);
    throw new HttpError(502, "El resumen con IA no está disponible ahora mismo");
  }
}

export async function getCoachSummary() {
  if (!llmClient.isLlmConfigured()) {
    throw new HttpError(503, "El resumen con IA no está configurado");
  }

  const day = todayKey();
  if (cache?.day === day) {
    return cache.summary;
  }

  if (!pending) {
    pending = generateSummary()
      .then((summary) => {
        cache = { day, summary };
        return summary;
      })
      .finally(() => {
        pending = null;
      });
  }

  return pending;
}
