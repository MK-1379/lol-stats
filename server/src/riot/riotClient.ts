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

const perkStyleSchema = z.object({
  style: z.number(),
  selections: z.array(z.object({ perk: z.number() })),
});

const participantSchema = z.object({
  participantId: z.number(),
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
  summoner1Id: z.number(),
  summoner2Id: z.number(),
  item0: z.number(),
  item1: z.number(),
  item2: z.number(),
  item3: z.number(),
  item4: z.number(),
  item5: z.number(),
  perks: z.object({
    statPerks: z.object({
      offense: z.number(),
      flex: z.number(),
      defense: z.number(),
    }),
    styles: z.tuple([perkStyleSchema, perkStyleSchema]),
  }),
});

const matchSchema = z.object({
  metadata: z.object({ matchId: z.string() }),
  info: z.object({
    gameCreation: z.number(),
    gameDuration: z.number(),
    gameVersion: z.string(),
    queueId: z.number(),
    participants: z.array(participantSchema),
  }),
});

const timelineSchema = z.object({
  info: z.object({
    frames: z.array(
      z.object({
        events: z.array(
          z.object({
            type: z.string(),
            timestamp: z.number(),
            participantId: z.number().optional(),
            itemId: z.number().optional(),
            beforeId: z.number().optional(),
            skillSlot: z.number().optional(),
            levelUpType: z.string().optional(),
          }),
        ),
      }),
    ),
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

const masteriesSchema = z.array(
  z.object({
    championId: z.number(),
    championLevel: z.number(),
    championPoints: z.number(),
    lastPlayTime: z.number(),
  }),
);

const apexLeagueSchema = z.object({
  entries: z.array(z.object({ puuid: z.string(), leaguePoints: z.number() })),
});

const summonerSchema = z.object({
  profileIconId: z.number(),
  summonerLevel: z.number(),
});

export type RiotAccount = z.infer<typeof accountSchema>;
export type RiotMatch = z.infer<typeof matchSchema>;
export type RiotParticipant = RiotMatch["info"]["participants"][number];
export type RiotTimeline = z.infer<typeof timelineSchema>;
export type RiotTimelineEvent =
  RiotTimeline["info"]["frames"][number]["events"][number];

export function getAccountByRiotId(gameName: string, tagLine: string) {
  const url = `${REGIONAL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch(url, accountSchema);
}

export function getMatchIds(puuid: string, queueId: number, count = 20) {
  const url = `${REGIONAL}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=${queueId}&count=${count}`;
  return riotFetch(url, z.array(z.string()));
}

export function getMatch(matchId: string) {
  const url = `${REGIONAL}/lol/match/v5/matches/${matchId}`;
  return riotFetch(url, matchSchema);
}

export function getMatchTimeline(matchId: string) {
  const url = `${REGIONAL}/lol/match/v5/matches/${matchId}/timeline`;
  return riotFetch(url, timelineSchema);
}

export function getRankEntries(puuid: string) {
  const url = `${PLATFORM}/lol/league/v4/entries/by-puuid/${puuid}`;
  return riotFetch(url, leagueEntriesSchema);
}

export const APEX_TIERS = ["challenger", "grandmaster", "master"] as const;
export type ApexTier = (typeof APEX_TIERS)[number];

export function getApexLeague(tier: ApexTier) {
  const url = `${PLATFORM}/lol/league/v4/${tier}leagues/by-queue/RANKED_SOLO_5x5`;
  return riotFetch(url, apexLeagueSchema);
}

export function getSummoner(puuid: string) {
  const url = `${PLATFORM}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch(url, summonerSchema);
}

export function getTopMasteries(puuid: string, count: number) {
  const url = `${PLATFORM}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`;
  return riotFetch(url, masteriesSchema);
}
