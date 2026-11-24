import { describe, expect, it } from "vitest";
import {
  buildCoachReport,
  buildMatchMetrics,
  buildWeeklyGoal,
  findMainPosition,
  type MatchMetrics,
  type ScoreboardLine,
} from "./coachService.js";

function line(overrides: Partial<ScoreboardLine>): ScoreboardLine {
  return {
    puuid: "other",
    teamId: 100,
    teamPosition: "MIDDLE",
    kills: 0,
    deaths: 0,
    assists: 0,
    cs: 0,
    visionScore: 0,
    goldEarned: 0,
    damageToChampions: 0,
    ...overrides,
  };
}

function game(overrides: Partial<MatchMetrics>): MatchMetrics {
  return {
    matchId: "EUW1_1",
    win: true,
    position: "MIDDLE",
    deaths: 3,
    csPerMinute: 8,
    visionPerMinute: 0.8,
    killParticipation: 0.6,
    csDiffPerMinute: 0.5,
    goldDiff: 300,
    ...overrides,
  };
}

describe("buildMatchMetrics", () => {
  const scoreboard = [
    line({ puuid: "me", kills: 4, assists: 6, cs: 200, visionScore: 15, goldEarned: 10000 }),
    line({ puuid: "ally", teamPosition: "TOP", kills: 6 }),
    line({ puuid: "rival", teamId: 200, cs: 230, goldEarned: 11000 }),
  ];

  it("calcula las métricas por minuto y la comparación con el rival de línea", () => {
    const metrics = buildMatchMetrics({
      matchId: "EUW1_1",
      win: false,
      durationSeconds: 1500,
      puuid: "me",
      scoreboard,
    });

    expect(metrics).toMatchObject({
      position: "MIDDLE",
      csPerMinute: 8,
      visionPerMinute: 0.6,
      killParticipation: 1,
      csDiffPerMinute: -1.2,
      goldDiff: -1000,
    });
  });

  it("descarta las partidas de menos de 5 minutos", () => {
    expect(
      buildMatchMetrics({ matchId: "x", win: false, durationSeconds: 200, puuid: "me", scoreboard }),
    ).toBeNull();
  });

  it("descarta las partidas sin posición, como ARAM", () => {
    const aram = [line({ puuid: "me", teamPosition: "" })];
    expect(
      buildMatchMetrics({ matchId: "x", win: true, durationSeconds: 1200, puuid: "me", scoreboard: aram }),
    ).toBeNull();
  });

  it("deja la comparación a null si no hay rival en la misma posición", () => {
    const metrics = buildMatchMetrics({
      matchId: "x",
      win: true,
      durationSeconds: 1200,
      puuid: "me",
      scoreboard: [line({ puuid: "me" })],
    });
    expect(metrics?.goldDiff).toBeNull();
  });
});

describe("findMainPosition", () => {
  it("devuelve la posición más jugada", () => {
    const games = [game({ position: "TOP" }), game({}), game({})];
    expect(findMainPosition(games)).toBe("MIDDLE");
  });

  it("devuelve null si no hay partidas", () => {
    expect(findMainPosition([])).toBeNull();
  });
});

describe("buildCoachReport", () => {
  it("ordena los consejos de peor a mejor y separa victorias de derrotas", () => {
    const games = [
      game({ win: true, deaths: 4 }),
      game({ win: false, deaths: 10, csPerMinute: 6.5 }),
      game({ win: false, deaths: 8, csPerMinute: 6.5 }),
    ];

    const report = buildCoachReport("MIDDLE", games);

    expect(report.tips.map((tip) => tip.metric)).toEqual(["deaths", "csPerMinute"]);
    expect(report.tips[0]).toMatchObject({ value: 7.33, target: 5, inWins: 4, inLosses: 9 });
    expect(report.winrate).toBe(33);
  });

  it("no da consejos de farmeo a un support", () => {
    const report = buildCoachReport("UTILITY", [game({ position: "UTILITY", csPerMinute: 1 })]);
    expect(report.tips.map((tip) => tip.metric)).not.toContain("csPerMinute");
  });

  it("devuelve como puntos fuertes las métricas que cumplen el objetivo", () => {
    const report = buildCoachReport("MIDDLE", [game({})]);
    expect(report.tips).toEqual([]);
    expect(report.strengths).toHaveLength(2);
  });
});

describe("buildWeeklyGoal", () => {
  it("propone mejorar dos partidas sobre las que ya cumples", () => {
    const games = [
      game({ deaths: 4 }),
      game({ deaths: 9 }),
      game({ deaths: 9 }),
      game({ deaths: 9 }),
    ];

    expect(buildWeeklyGoal("MIDDLE", games)).toMatchObject({
      metric: "deaths",
      target: 5,
      currentHits: 1,
      requiredHits: 3,
      outOf: 10,
    });
  });

  it("devuelve null si cumples todos los objetivos", () => {
    expect(buildWeeklyGoal("MIDDLE", [game({})])).toBeNull();
  });
});
