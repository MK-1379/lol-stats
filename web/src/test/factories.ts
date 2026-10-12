import type { MatchItem } from "../api/types";

export function makeMatch(overrides: Partial<MatchItem> = {}): MatchItem {
  return {
    matchId: "EUW1_1",
    playedAt: "2026-10-11T08:00:00.000Z",
    durationSeconds: 1800,
    champion: "Leona",
    position: "UTILITY",
    win: true,
    kills: 2,
    deaths: 3,
    assists: 12,
    kda: 4.67,
    cs: 40,
    visionScore: 60,
    ...overrides,
  };
}
