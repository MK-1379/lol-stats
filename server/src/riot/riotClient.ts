import { z } from "zod";
import { env } from "../config/env.js";

const REGIONAL = "https://europe.api.riotgames.com";
const PLATFORM = "https://euw1.api.riotgames.com";

export class RiotApiError extends Error {
  constructor(public status: number, url: string) {
    super(`Riot API respondió ${status} en ${url}`);
  }
}

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function riotFetch<T>(
  url: string,
  schema: z.ZodType<T>,
  attempt = 0,
): Promise<T> {
  const response = await fetch(url, {
    headers: { "X-Riot-Token": env.RIOT_API_KEY },
  });

  const canRetry = attempt < MAX_RETRIES;

  if (response.status === 429 && canRetry) {
    const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
    console.warn(`[riot] 429: esperando ${retryAfter}s antes de reintentar`);
    await sleep(retryAfter * 1000);
    return riotFetch(url, schema, attempt + 1);
  }

  if (response.status >= 500 && canRetry) {
    await sleep(2 ** attempt * 1000);
    return riotFetch(url, schema, attempt + 1);
  }

  if (!response.ok) {
    throw new RiotApiError(response.status, url);
  }
  return schema.parse(await response.json());
}

const accountSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  tagLine: z.string(),
});

const participantSchema = z.object({
  puuid: z.string(),
  riotIdGameName: z.string().default(""),
  riotIdTagline: z.string().default(""),
  teamId: z.number(),
  champLevel: z.number(),
  goldEarned: z.number(),
  totalDamageDealtToChampions: z.number(),
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

export function getRankEntries(puuid: string) {
  const url = `${PLATFORM}/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetch(url, leagueEntriesSchema);
}

export function getSummoner(puuid: string) {
  const url = `${PLATFORM}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url, summonerSchema);
}
