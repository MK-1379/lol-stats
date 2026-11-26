import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../db/prisma.js", () => ({
  prisma: {
    buildMatch: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("../riot/riotClient.js", () => ({
  APEX_TIERS: ["challenger", "grandmaster", "master"],
  getApexLeague: vi.fn(),
  getMatchIds: vi.fn(),
}));

vi.mock("./syncBuilds.js", () => ({
  saveBuildMatch: vi.fn(),
}));

import { prisma } from "../db/prisma.js";
import { getApexLeague, getMatchIds } from "../riot/riotClient.js";
import { saveBuildMatch } from "./syncBuilds.js";
import { pickRandom, pruneHighEloBuilds, syncHighEloBuilds } from "./syncHighElo.js";

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getApexLeague).mockResolvedValue({
    entries: [
      { puuid: "a", leaguePoints: 1200 },
      { puuid: "b", leaguePoints: 900 },
    ],
  });
  vi.mocked(getMatchIds).mockImplementation(async (puuid) => [`EUW1_${puuid}1`, "EUW1_shared"]);
  vi.mocked(prisma.buildMatch.findMany).mockResolvedValue([{ matchId: "EUW1_a1" }] as never);
  vi.mocked(prisma.buildMatch.deleteMany).mockResolvedValue({ count: 3 });
  vi.mocked(saveBuildMatch).mockResolvedValue(undefined);
});

describe("pickRandom", () => {
  it("devuelve como mucho count elementos sin repetir", () => {
    const picked = pickRandom([1, 2, 3, 4, 5], 3);

    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
  });

  it("no modifica el array original", () => {
    const items = [1, 2, 3];
    pickRandom(items, 2, () => 0);

    expect(items).toEqual([1, 2, 3]);
  });
});

describe("pruneHighEloBuilds", () => {
  it("borra solo partidas de alto elo de hace más de 14 días", async () => {
    await pruneHighEloBuilds(new Date("2026-11-26T00:00:00Z"));

    expect(prisma.buildMatch.deleteMany).toHaveBeenCalledWith({
      where: { source: "highElo", gameCreation: { lt: new Date("2026-11-12T00:00:00Z") } },
    });
  });
});

describe("syncHighEloBuilds", () => {
  it("no hace ninguna petición si el límite es 0", async () => {
    const result = await syncHighEloBuilds(0);

    expect(result.saved).toBe(0);
    expect(getApexLeague).not.toHaveBeenCalled();
  });

  it("guarda solo partidas nuevas, sin repetir, como highElo", async () => {
    const result = await syncHighEloBuilds(10);

    const saved = vi.mocked(saveBuildMatch).mock.calls.map(([matchId]) => matchId);
    expect(saved.sort()).toEqual(["EUW1_b1", "EUW1_shared"]);
    expect(saveBuildMatch).toHaveBeenCalledWith("EUW1_shared", "highElo");
    expect(result).toEqual({ players: 2, saved: 2, failed: 0, pruned: 3 });
  });

  it("respeta el máximo de partidas por vuelta", async () => {
    await syncHighEloBuilds(1);

    expect(saveBuildMatch).toHaveBeenCalledTimes(1);
  });

  it("sigue con las demás si una partida falla", async () => {
    vi.mocked(saveBuildMatch).mockRejectedValueOnce(new Error("404"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await syncHighEloBuilds(10);

    expect(result).toMatchObject({ saved: 1, failed: 1 });
  });
});
