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
}));

vi.mock("../repositories/playerRepository.js", () => ({
  findPlayer: vi.fn(),
  findLatestRank: vi.fn(),
  findRankHistory: vi.fn(),
}));

import { createApp } from "../app.js";
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
    expect(matchRepository.findMatches).toHaveBeenCalledWith(20, 0);
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
    vi.mocked(matchRepository.countMatches).mockResolvedValue(0);
    vi.mocked(matchRepository.countWins).mockResolvedValue(0);
    vi.mocked(matchRepository.sumKda).mockResolvedValue({
      _sum: { kills: null, deaths: null, assists: null },
    } as never);

    const response = await request(app).get("/api/summary");

    expect(response.status).toBe(404);
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
});
