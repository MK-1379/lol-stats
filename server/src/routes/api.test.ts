import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Sustituimos los repositorios por funciones falsas: los tests no tocan MySQL
vi.mock("../repositories/matchRepository.js", () => ({
  findMatches: vi.fn(),
  countMatches: vi.fn(),
  countWins: vi.fn(),
  sumKda: vi.fn(),
  statsByChampion: vi.fn(),
  winsByChampion: vi.fn(),
  findChampionsByIds: vi.fn(),
  findLastMatches: vi.fn(),
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
