import { prisma } from "../db/prisma.js";
import { getMatch, type RiotMatch } from "../riot/riotClient.js";

export function toScoreboardEntries(match: RiotMatch) {
  return match.info.participants.map((participant) => ({
    puuid: participant.puuid,
    gameName: participant.riotIdGameName,
    tagLine: participant.riotIdTagline,
    championId: participant.championId,
    teamId: participant.teamId,
    teamPosition: participant.teamPosition,
    win: participant.win,
    champLevel: participant.champLevel,
    kills: participant.kills,
    deaths: participant.deaths,
    assists: participant.assists,
    cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
    visionScore: participant.visionScore,
    goldEarned: participant.goldEarned,
    damageToChampions: participant.totalDamageDealtToChampions,
  }));
}

export async function syncScoreboards() {
  const pending = await prisma.match.findMany({
    where: { scoreboard: { none: {} } },
    select: { matchId: true },
    orderBy: { gameCreation: "desc" },
  });

  for (const { matchId } of pending) {
    const match = await getMatch(matchId);
    await prisma.scoreboardEntry.createMany({
      data: toScoreboardEntries(match).map((entry) => ({ matchId, ...entry })),
      skipDuplicates: true,
    });
  }

  return { filled: pending.length };
}
