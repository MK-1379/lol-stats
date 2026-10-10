import { z } from "zod";
import { env } from "../config/env.js";

const REGIONAL = "https://europe.api.riotgames.com";
const PLATFORM = "https://euw1.api.riotgames.com";

export class RiotApiError extends Error {
  constructor(public status: number, url: string) {
    super(`Riot API respondió ${status} en ${url}`);
  }
}

async function riotFetch<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, {
    headers: { "X-Riot-Token": env.RIOT_API_KEY },
  });
  if (!response.ok) {
    throw new RiotApiError(response.status, url);
  }
  return schema.parse(await response.json());
}

// --- Esquemas: solo los campos que se usan ---
const accountSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  tagLine: z.string(),
});

const participantSchema = z.object({
  puuid: z.string(),
  championId: z.number(),
  championName: z.string(),
  teamPosition: z.string(),
  win: z.boolean(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  totalMinionsKilled: z.number(),
  neutralMinionsKilled: z.number(),
  visionScore: z.number(),
});

const matchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(),
    queueId: z.number(),
    participants: z.array(participantSchema),
  }),
});

// esquema del rango
const leagueEntriesSchema = z.array(
  z.object({
    queueType: z.string(),
    tier: z.string(),
    rank: z.string(),
    leaguePoints: z.number(),
    wins: z.number(),
    losses: z.number(),
  }),
);

const summonerSchema = z.object({
  profileIconId: z.number(),
  summonerLevel: z.number(),
});

export type RiotAccount = z.infer<typeof accountSchema>;
export type RiotMatch = z.infer<typeof matchSchema>;

// --- Funciones públicas ---
export function getAccountByRiotId(gameName: string, tagLine: string) {
  const url = `${REGIONAL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch(url, accountSchema);
}

export function getMatchIds(puuid: string, count = 20) {
  const url = `${REGIONAL}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&count=${count}`;
  return riotFetch(url, z.array(z.string()));
}

export function getMatch(matchId: string) {
  const url = `${REGIONAL}/lol/match/v5/matches/${matchId}`;
  return riotFetch(url, matchSchema);
}

// función del rango (usa PLATFORM, no REGIONAL)
export function getRankEntries(puuid: string) {
  const url = `${PLATFORM}/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetch(url, leagueEntriesSchema);
}

export function getSummoner(puuid: string) {
  const url = `${PLATFORM}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url, summonerSchema);
}
