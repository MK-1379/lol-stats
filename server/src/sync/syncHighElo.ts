import { RANKED_QUEUES } from "../config/queues.js";
import { prisma } from "../db/prisma.js";
import { APEX_TIERS, getApexLeague, getMatchIds } from "../riot/riotClient.js";
import { saveBuildMatch } from "./syncBuilds.js";

export const PLAYERS_PER_RUN = 10;
export const MATCHES_PER_PLAYER = 5;
export const RETENTION_DAYS = 14;

export function pickRandom<T>(items: T[], count: number, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

async function findApexPlayers() {
  const puuids: string[] = [];
  for (const tier of APEX_TIERS) {
    const league = await getApexLeague(tier);
    puuids.push(...league.entries.map((entry) => entry.puuid));
  }
  return [...new Set(puuids)];
}

export async function pruneHighEloBuilds(now = new Date()) {
  const limit = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.buildMatch.deleteMany({
    where: { source: "highElo", gameCreation: { lt: limit } },
  });
  return count;
}

export async function syncHighEloBuilds(maxMatches: number) {
  if (maxMatches === 0) return { players: 0, saved: 0, failed: 0, pruned: 0 };

  const players = pickRandom(await findApexPlayers(), PLAYERS_PER_RUN);
  const candidates = new Set<string>();

  for (const puuid of players) {
    const ids = await getMatchIds(puuid, RANKED_QUEUES.solo.queueId, MATCHES_PER_PLAYER);
    ids.forEach((id) => candidates.add(id));
  }

  const existing = await prisma.buildMatch.findMany({
    where: { matchId: { in: [...candidates] } },
    select: { matchId: true },
  });
  const existingIds = new Set(existing.map((match) => match.matchId));
  const pending = [...candidates].filter((id) => !existingIds.has(id)).slice(0, maxMatches);

  let saved = 0;
  for (const matchId of pending) {
    try {
      await saveBuildMatch(matchId, "highElo");
      saved++;
    } catch (error) {
      console.error(`[high-elo] No se pudo guardar ${matchId}:`, error);
    }
  }

  const pruned = await pruneHighEloBuilds();

  return { players: players.length, saved, failed: pending.length - saved, pruned };
}
