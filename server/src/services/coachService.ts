import { HttpError } from "../middlewares/errorHandler.js";
import * as matchRepository from "../repositories/matchRepository.js";
import * as playerRepository from "../repositories/playerRepository.js";

export interface ScoreboardLine {
  puuid: string;
  teamId: number;
  teamPosition: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  visionScore: number;
  goldEarned: number;
  damageToChampions: number;
}

export interface CoachMatchInput {
  matchId: string;
  win: boolean;
  durationSeconds: number;
  puuid: string;
  scoreboard: ScoreboardLine[];
}

export interface MatchMetrics {
  matchId: string;
  win: boolean;
  position: string;
  deaths: number;
  csPerMinute: number;
  visionPerMinute: number;
  killParticipation: number;
  csDiffPerMinute: number | null;
  goldDiff: number | null;
}

type MetricKey =
  | "deaths"
  | "csPerMinute"
  | "visionPerMinute"
  | "killParticipation"
  | "csDiffPerMinute"
  | "goldDiff";

interface CoachRule {
  metric: MetricKey;
  label: string;
  direction: "higher" | "lower";
  targets: Record<string, number | null>;
  step: number;
  advice: string;
}

export const MIN_GAMES = 5;
const MIN_DURATION_SECONDS = 300;
const GOAL_WINDOW = 10;

export const COACH_RULES: CoachRule[] = [
  {
    metric: "deaths",
    label: "Muertes por partida",
    direction: "lower",
    targets: { TOP: 5, JUNGLE: 5, MIDDLE: 5, BOTTOM: 5, UTILITY: 6 },
    step: 2,
    advice:
      "Mueres demasiado. Antes de pelear o avanzar, mira el minimapa y cuenta cuántos enemigos no se ven: si faltan dos o más, juega seguro.",
  },
  {
    metric: "csPerMinute",
    label: "Súbditos por minuto",
    direction: "higher",
    targets: { TOP: 7, JUNGLE: 5.5, MIDDLE: 7.5, BOTTOM: 8, UTILITY: null },
    step: 1,
    advice:
      "Pierdes mucho oro de farmeo. Practica 10 minutos de último golpe en la herramienta de práctica y recoge las oleadas laterales entre objetivos.",
  },
  {
    metric: "visionPerMinute",
    label: "Visión por minuto",
    direction: "higher",
    targets: { TOP: 0.6, JUNGLE: 1, MIDDLE: 0.7, BOTTOM: 0.6, UTILITY: 2 },
    step: 0.3,
    advice:
      "Te falta visión. Compra un centinela de control cada vez que vuelvas a base y usa el abalorio antes de que salga cada objetivo.",
  },
  {
    metric: "killParticipation",
    label: "Participación en kills",
    direction: "higher",
    targets: { TOP: 0.45, JUNGLE: 0.6, MIDDLE: 0.55, BOTTOM: 0.55, UTILITY: 0.6 },
    step: 0.1,
    advice:
      "Participas poco en las peleas de tu equipo. Cuando vaya a salir un dragón o un heraldo, empuja tu oleada y muévete con tu equipo un minuto antes.",
  },
  {
    metric: "csDiffPerMinute",
    label: "Diferencia de súbditos con tu rival",
    direction: "higher",
    targets: { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: null },
    step: 0.5,
    advice:
      "Tu rival de línea farmea más que tú. Fíjate en cuándo vuelve a base y aprovecha ese momento para empujar la oleada contra su torre.",
  },
  {
    metric: "goldDiff",
    label: "Diferencia de oro con tu rival",
    direction: "higher",
    targets: { TOP: 0, JUNGLE: 0, MIDDLE: 0, BOTTOM: 0, UTILITY: 0 },
    step: 500,
    advice:
      "Acabas las partidas con menos oro que tu rival directo. Prioriza farmear y no regalar muertes antes que buscar jugadas arriesgadas.",
  },
];

export function buildMatchMetrics(match: CoachMatchInput): MatchMetrics | null {
  const me = match.scoreboard.find((line) => line.puuid === match.puuid);

  if (!me || !me.teamPosition || match.durationSeconds < MIN_DURATION_SECONDS) {
    return null;
  }

  const minutes = match.durationSeconds / 60;
  const teamKills = match.scoreboard
    .filter((line) => line.teamId === me.teamId)
    .reduce((total, line) => total + line.kills, 0);
  const opponent = match.scoreboard.find(
    (line) => line.teamId !== me.teamId && line.teamPosition === me.teamPosition,
  );

  return {
    matchId: match.matchId,
    win: match.win,
    position: me.teamPosition,
    deaths: me.deaths,
    csPerMinute: me.cs / minutes,
    visionPerMinute: me.visionScore / minutes,
    killParticipation: teamKills === 0 ? 0 : (me.kills + me.assists) / teamKills,
    csDiffPerMinute: opponent ? (me.cs - opponent.cs) / minutes : null,
    goldDiff: opponent ? me.goldEarned - opponent.goldEarned : null,
  };
}

export function findMainPosition(games: MatchMetrics[]) {
  const counts = new Map<string, number>();
  for (const game of games) {
    counts.set(game.position, (counts.get(game.position) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function average(games: MatchMetrics[], metric: MetricKey) {
  const values = games
    .map((game) => game[metric])
    .filter((value): value is number => value !== null);
  if (values.length === 0) {
    return null;
  }
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function meetsTarget(value: number, target: number, rule: CoachRule) {
  return rule.direction === "higher" ? value >= target : value <= target;
}

function distanceToTarget(value: number, target: number, rule: CoachRule) {
  const gap = rule.direction === "higher" ? target - value : value - target;
  return gap / rule.step;
}

export function buildCoachReport(position: string, games: MatchMetrics[]) {
  const wins = games.filter((game) => game.win);
  const losses = games.filter((game) => !game.win);

  const evaluated = COACH_RULES.flatMap((rule) => {
    const target = rule.targets[position] ?? null;
    const value = average(games, rule.metric);
    if (target === null || value === null) {
      return [];
    }
    return [{ rule, target, value, distance: distanceToTarget(value, target, rule) }];
  });

  const tips = evaluated
    .filter((item) => item.distance > 0)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, 3)
    .map(({ rule, target, value }) => ({
      metric: rule.metric,
      label: rule.label,
      direction: rule.direction,
      value,
      target,
      advice: rule.advice,
      inWins: average(wins, rule.metric),
      inLosses: average(losses, rule.metric),
    }));

  const strengths = evaluated
    .filter((item) => item.distance <= 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 2)
    .map(({ rule, target, value }) => ({
      metric: rule.metric,
      label: rule.label,
      direction: rule.direction,
      value,
      target,
    }));

  return {
    position,
    gamesAnalyzed: games.length,
    winrate: Math.round((wins.length / games.length) * 100),
    tips,
    strengths,
    weeklyGoal: buildWeeklyGoal(position, games),
  };
}

export function buildWeeklyGoal(position: string, games: MatchMetrics[]) {
  const worst = COACH_RULES.flatMap((rule) => {
    const target = rule.targets[position] ?? null;
    const value = average(games, rule.metric);
    if (target === null || value === null) {
      return [];
    }
    return [{ rule, target, distance: distanceToTarget(value, target, rule) }];
  })
    .filter((item) => item.distance > 0)
    .sort((a, b) => b.distance - a.distance)[0];

  if (!worst) {
    return null;
  }

  const recent = games.slice(0, GOAL_WINDOW).flatMap((game) => {
    const value = game[worst.rule.metric];
    return value === null ? [] : [value];
  });
  const currentHits = recent.filter((value) =>
    meetsTarget(value, worst.target, worst.rule),
  ).length;

  return {
    metric: worst.rule.metric,
    label: worst.rule.label,
    direction: worst.rule.direction,
    target: worst.target,
    outOf: GOAL_WINDOW,
    currentHits,
    requiredHits: Math.min(GOAL_WINDOW, currentHits + 2),
  };
}

export async function getCoachReport(last: number) {
  const player = await playerRepository.findPlayer();

  if (!player) {
    throw new HttpError(404, "Todavía no hay datos: espera a la primera sincronización");
  }

  const rows = await matchRepository.findCoachMatches(last);
  const games = rows
    .map((row) =>
      buildMatchMetrics({
        matchId: row.matchId,
        win: row.win,
        durationSeconds: row.match.gameDuration,
        puuid: player.puuid,
        scoreboard: row.match.scoreboard,
      }),
    )
    .filter((game): game is MatchMetrics => game !== null);

  const position = findMainPosition(games);
  const gamesInPosition = games.filter((game) => game.position === position);

  if (!position || gamesInPosition.length < MIN_GAMES) {
    throw new HttpError(
      404,
      `Necesito al menos ${MIN_GAMES} partidas con posición para darte consejos`,
    );
  }

  return buildCoachReport(position, gamesInPosition);
}
