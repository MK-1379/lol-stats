import { prisma } from "../db/prisma.js";
import {
  getAccountByRiotId,
  getSummoner,
  getRankEntries,
  getMatchIds,
  getMatch,
} from "../riot/riotClient.js";

export async function syncPlayer(gameName: string, tagLine: string) {

  const account = await getAccountByRiotId(gameName, tagLine);
  const summoner = await getSummoner(account.puuid);

  const playerData = {
    gameName: account.gameName,
    tagLine: account.tagLine,
    profileIconId: summoner.profileIconId,
  };

  await prisma.player.upsert({
    where: { puuid: account.puuid },
    update: playerData,
    create: { puuid: account.puuid, ...playerData },
  });

  const ranks = await getRankEntries(account.puuid);
  const soloQ = ranks.find((entry) => entry.queueType === "RANKED_SOLO_5x5");

  if (soloQ) {
    await prisma.rankSnapshot.create({
      data: { puuid: account.puuid, ...soloQ },
    });
  }

  const matchIds = await getMatchIds(account.puuid, 20);

  const existing = await prisma.match.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true },
  });
  const existingIds = new Set(existing.map((match) => match.matchId));
  const newIds = matchIds.filter((id) => !existingIds.has(id));

  for (const matchId of newIds) {
    const match = await getMatch(matchId);
    const me = match.info.participants.find((p) => p.puuid === account.puuid);
    if (!me) continue;

    await prisma.match.create({
      data: {
        matchId: match.metadata.matchId,
        queueId: match.info.queueId,
        gameCreation: new Date(match.info.gameCreation),
        gameDuration: match.info.gameDuration,
        participants: {
          create: {
            puuid: account.puuid,
            championId: me.championId,
            teamPosition: me.teamPosition,
            win: me.win,
            kills: me.kills,
            deaths: me.deaths,
            assists: me.assists,
            cs: me.totalMinionsKilled + me.neutralMinionsKilled,
            visionScore: me.visionScore,
          },
        },
      },
    });
  }

  return { newMatches: newIds.length, rank: soloQ };
}
