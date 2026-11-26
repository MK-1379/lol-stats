import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/matchRepository.js", () => ({
  findMatches: vi.fn(),
  countMatches: vi.fn(),
  countWins: vi.fn(),
  sumKda: vi.fn(),
  statsByChampion: vi.fn(),
  winsByChampion: vi.fn(),
  findChampionsByIds: vi.fn(),
  findLastMatches: vi.fn(),
  findScoreboard: vi.fn(),
  findCoachMatches: vi.fn(),
}));

vi.mock("../repositories/playerRepository.js", () => ({
  findPlayer: vi.fn(),
  findLatestRank: vi.fn(),
  findRankHistory: vi.fn(),
  findRankLevels: vi.fn(),
  findTopMasteries: vi.fn(),
}));

vi.mock("../repositories/buildRepository.js", () => ({
  findChampionByKey: vi.fn(),
  findBuildSamples: vi.fn(),
}));

vi.mock("../ddragon/staticData.js", () => ({
  getStaticData: vi.fn(),
}));

import { createApp } from "../app.js";
import { getStaticData } from "../ddragon/staticData.js";
import * as buildRepository from "../repositories/buildRepository.js";
import * as matchRepository from "../repositories/matchRepository.js";
import * as playerRepository from "../repositories/playerRepository.js";

const app = createApp();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("API REST", () => {
  it("GET /api/health responde ok", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("GET /api/matches usa limit=20 y offset=0 por defecto", async () => {
    vi.mocked(matchRepository.findMatches).mockResolvedValue([]);
    vi.mocked(matchRepository.countMatches).mockResolvedValue(0);

    const response = await request(app).get("/api/matches");

    expect(response.status).toBe(200);
    expect(matchRepository.findMatches).toHaveBeenCalledWith(20, 0, "all");
    expect(response.body).toEqual({ total: 0, limit: 20, offset: 0, items: [] });
  });

  it("GET /api/matches rechaza un limit fuera de rango con 400", async () => {
    const response = await request(app).get("/api/matches?limit=500");

    expect(response.status).toBe(400);
    expect(response.body.details).toHaveProperty("limit");
    expect(matchRepository.findMatches).not.toHaveBeenCalled();
  });

  it("GET /api/summary responde 404 si todavía no hay jugador", async () => {
    vi.mocked(playerRepository.findPlayer).mockResolvedValue(null);
    vi.mocked(playerRepository.findLatestRank).mockResolvedValue(null);
    vi.mocked(playerRepository.findRankLevels).mockResolvedValue([] as never);
    vi.mocked(matchRepository.countMatches).mockResolvedValue(0);
    vi.mocked(matchRepository.countWins).mockResolvedValue(0);
    vi.mocked(matchRepository.sumKda).mockResolvedValue({
      _sum: { kills: null, deaths: null, assists: null },
    } as never);

    const response = await request(app).get("/api/summary");

    expect(response.status).toBe(404);
  });

  it("GET /api/summary incluye el peak con la fecha en que se alcanzó por primera vez", async () => {
    vi.mocked(playerRepository.findPlayer).mockResolvedValue({
      gameName: "M0n0kuum44",
      tagLine: "SSJ",
      profileIconId: 1,
    } as never);
    vi.mocked(playerRepository.findLatestRank).mockResolvedValue({
      tier: "EMERALD",
      rank: "III",
      leaguePoints: 20,
      wins: 10,
      losses: 8,
    } as never);
    vi.mocked(playerRepository.findRankLevels).mockResolvedValue([
      { tier: "EMERALD", rank: "III", leaguePoints: 20, _min: { takenAt: new Date("2026-11-20T10:00:00Z") } },
      { tier: "EMERALD", rank: "II", leaguePoints: 45, _min: { takenAt: new Date("2026-11-10T10:00:00Z") } },
      { tier: "PLATINUM", rank: "I", leaguePoints: 90, _min: { takenAt: new Date("2026-11-01T10:00:00Z") } },
    ] as never);
    vi.mocked(matchRepository.countMatches).mockResolvedValue(0);
    vi.mocked(matchRepository.countWins).mockResolvedValue(0);
    vi.mocked(matchRepository.sumKda).mockResolvedValue({
      _sum: { kills: null, deaths: null, assists: null },
    } as never);

    const response = await request(app).get("/api/summary?queue=solo");

    expect(response.status).toBe(200);
    expect(playerRepository.findLatestRank).toHaveBeenCalledWith("RANKED_SOLO_5x5");
    expect(response.body.ranks).toHaveLength(1);
    expect(response.body.ranks[0].peak).toEqual({
      tier: "EMERALD",
      rank: "II",
      leaguePoints: 45,
      reachedAt: "2026-11-10T10:00:00.000Z",
    });
  });

  it("GET /api/summary con queue=all devuelve solo las colas en las que estás clasificado", async () => {
    vi.mocked(playerRepository.findPlayer).mockResolvedValue({
      gameName: "M0n0kuum44",
      tagLine: "SSJ",
      profileIconId: 1,
    } as never);
    vi.mocked(playerRepository.findLatestRank).mockImplementation(((queueType: string) =>
      Promise.resolve(
        queueType === "RANKED_FLEX_SR"
          ? { tier: "GOLD", rank: "I", leaguePoints: 10, wins: 3, losses: 2 }
          : null,
      )) as never);
    vi.mocked(playerRepository.findRankLevels).mockResolvedValue([] as never);
    vi.mocked(matchRepository.countMatches).mockResolvedValue(0);
    vi.mocked(matchRepository.countWins).mockResolvedValue(0);
    vi.mocked(matchRepository.sumKda).mockResolvedValue({
      _sum: { kills: null, deaths: null, assists: null },
    } as never);

    const response = await request(app).get("/api/summary");

    expect(response.status).toBe(200);
    expect(response.body.ranks).toEqual([
      { queue: "flex", tier: "GOLD", rank: "I", leaguePoints: 10, wins: 3, losses: 2, peak: null },
    ]);
    expect(matchRepository.countMatches).toHaveBeenCalledWith("all");
  });

  it("GET /api/masteries devuelve las maestrías con el nombre del campeón", async () => {
    vi.mocked(playerRepository.findTopMasteries).mockResolvedValue([
      {
        championId: 238,
        level: 97,
        points: 1054721,
        lastPlayedAt: new Date("2026-11-23T18:00:00Z"),
        champion: { name: "Zed" },
      },
    ] as never);

    const response = await request(app).get("/api/masteries");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        championId: 238,
        champion: "Zed",
        level: 97,
        points: 1054721,
        lastPlayedAt: "2026-11-23T18:00:00.000Z",
      },
    ]);
  });

  it("GET /api/masteries devuelve una lista vacía si aún no se han sincronizado", async () => {
    vi.mocked(playerRepository.findTopMasteries).mockResolvedValue([]);

    const response = await request(app).get("/api/masteries");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("GET /api/matches rechaza una cola desconocida con 400", async () => {
    const response = await request(app).get("/api/matches?queue=aram");

    expect(response.status).toBe(400);
    expect(response.body.details).toHaveProperty("queue");
  });

  it("GET /api/matches marca cada partida con su cola", async () => {
    vi.mocked(matchRepository.findMatches).mockResolvedValue([
      {
        matchId: "EUW1_2",
        teamPosition: "MIDDLE",
        win: true,
        kills: 1,
        deaths: 1,
        assists: 1,
        cs: 100,
        visionScore: 10,
        champion: { name: "Ahri" },
        match: { queueId: 440, gameCreation: new Date("2026-11-24T10:00:00Z"), gameDuration: 1500 },
      },
    ] as never);
    vi.mocked(matchRepository.countMatches).mockResolvedValue(1);

    const response = await request(app).get("/api/matches?queue=flex");

    expect(matchRepository.findMatches).toHaveBeenCalledWith(20, 0, "flex");
    expect(response.body.items[0].queue).toBe("flex");
  });

  it("GET /api/champions calcula winrate y KDA por campeón", async () => {
    vi.mocked(matchRepository.statsByChampion).mockResolvedValue([
      { championId: 89, _count: { _all: 4 }, _sum: { kills: 4, deaths: 8, assists: 40 } },
    ] as never);
    vi.mocked(matchRepository.winsByChampion).mockResolvedValue([
      { championId: 89, _count: { _all: 3 } },
    ] as never);
    vi.mocked(matchRepository.findChampionsByIds).mockResolvedValue([
      { id: 89, key: "Leona", name: "Leona" },
    ]);

    const response = await request(app).get("/api/champions");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { championId: 89, champion: "Leona", games: 4, wins: 3, winrate: 75, kda: 5.5 },
    ]);
  });

  it("GET /api/matches/:id/scoreboard rechaza un id con formato no válido", async () => {
    const response = await request(app).get("/api/matches/abc;DROP/scoreboard");

    expect(response.status).toBe(400);
    expect(matchRepository.findScoreboard).not.toHaveBeenCalled();
  });

  it("GET /api/matches/:id/scoreboard responde 404 si la partida no tiene marcador", async () => {
    vi.mocked(matchRepository.findScoreboard).mockResolvedValue([]);
    vi.mocked(playerRepository.findPlayer).mockResolvedValue(null);

    const response = await request(app).get("/api/matches/EUW1_123/scoreboard");

    expect(response.status).toBe(404);
  });

  it("GET /api/matches/:id/scoreboard pone primero mi equipo y ordena por posición", async () => {
    const entry = (puuid: string, teamId: number, teamPosition: string, win: boolean) => ({
      id: 1,
      matchId: "EUW1_123",
      puuid,
      gameName: puuid,
      tagLine: "EUW",
      championId: 89,
      teamId,
      teamPosition,
      win,
      champLevel: 14,
      kills: 2,
      deaths: 2,
      assists: 6,
      cs: 30,
      visionScore: 40,
      goldEarned: 9000,
      damageToChampions: 12000,
      champion: { id: 89, key: "Leona", name: "Leona" },
    });
    vi.mocked(matchRepository.findScoreboard).mockResolvedValue([
      entry("rival", 100, "TOP", true),
      entry("aliado", 200, "MIDDLE", false),
      entry("yo", 200, "UTILITY", false),
    ] as never);
    vi.mocked(playerRepository.findPlayer).mockResolvedValue({ puuid: "yo" } as never);

    const response = await request(app).get("/api/matches/EUW1_123/scoreboard");

    expect(response.status).toBe(200);
    const [myTeam, enemyTeam] = response.body.teams;
    expect(myTeam).toMatchObject({ teamId: 200, isMyTeam: true, win: false, kills: 4 });
    expect(myTeam.players.map((p: { gameName: string }) => p.gameName)).toEqual(["aliado", "yo"]);
    expect(myTeam.players[1]).toMatchObject({ isMe: true, kda: 4 });
    expect(enemyTeam).toMatchObject({ teamId: 100, isMyTeam: false, win: true });
    expect(response.body.teams[0].players[0]).not.toHaveProperty("puuid");
  });

  it("una ruta que no existe responde 404", async () => {
    const response = await request(app).get("/api/no-existe");

    expect(response.status).toBe(404);
  });

  it("un error inesperado responde 500 sin dar detalles", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(matchRepository.statsByChampion).mockRejectedValue(
      new Error("Conexión perdida con MySQL"),
    );
    vi.mocked(matchRepository.winsByChampion).mockResolvedValue([]);

    const response = await request(app).get("/api/champions");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Error interno del servidor" });
  });
  it("GET /api/coach rechaza last menor que 5 con 400", async () => {
    const response = await request(app).get("/api/coach?last=2");

    expect(response.status).toBe(400);
    expect(matchRepository.findCoachMatches).not.toHaveBeenCalled();
  });

  it("GET /api/coach responde 404 si hay pocas partidas", async () => {
    vi.mocked(playerRepository.findPlayer).mockResolvedValue({ puuid: "me" } as never);
    vi.mocked(matchRepository.findCoachMatches).mockResolvedValue([]);

    const response = await request(app).get("/api/coach");

    expect(response.status).toBe(404);
    expect(matchRepository.findCoachMatches).toHaveBeenCalledWith(20, "all");
  });

  it("GET /api/champions/:key/build responde 404 si el campeón no existe", async () => {
    vi.mocked(buildRepository.findChampionByKey).mockResolvedValue(null);

    const response = await request(app).get("/api/champions/Noexiste/build");

    expect(response.status).toBe(404);
  });

  it("GET /api/champions/:key/build rechaza una posición desconocida con 400", async () => {
    const response = await request(app).get("/api/champions/Nami/build?position=SUPP");

    expect(response.status).toBe(400);
    expect(buildRepository.findChampionByKey).not.toHaveBeenCalled();
  });

  it("GET /api/champions/:key/build usa la posición más jugada por defecto", async () => {
    vi.mocked(buildRepository.findChampionByKey).mockResolvedValue({
      id: 267,
      key: "Nami",
      name: "Nami",
    });
    vi.mocked(buildRepository.findBuildSamples).mockResolvedValue([
      {
        teamPosition: "UTILITY",
        win: true,
        spell1: 4,
        spell2: 14,
        primaryStyle: 8200,
        subStyle: 8300,
        perks: [8214, 8226, 8210, 8237, 8345, 8352],
        shards: [5008, 5008, 5011],
        startItems: [3850],
        itemOrder: [3158],
        skillOrder: "WQE",
        match: { source: "own", patch: "16.20" },
      },
    ]);
    vi.mocked(getStaticData).mockResolvedValue({
      version: "16.20.1",
      items: new Map([[3158, { id: 3158, name: "Botas jonias", icon: "boots.png", kind: "boots" }]]),
      runes: new Map(),
      spells: new Map([[4, { id: 4, name: "Destello", icon: "flash.png" }]]),
    });

    const response = await request(app).get("/api/champions/nami/build");

    expect(response.status).toBe(200);
    expect(buildRepository.findChampionByKey).toHaveBeenCalledWith("nami");
    expect(response.body).toMatchObject({
      champion: { key: "Nami" },
      position: "UTILITY",
      games: 1,
      sources: { own: 1, highElo: 0 },
      patches: ["16.20"],
      boots: [{ games: 1, value: { name: "Botas jonias" } }],
    });
    expect(response.body.spells[0].value[0].name).toBe("Destello");
    expect(response.body.spells[0].value[1].name).toBe("#14");
  });
});
