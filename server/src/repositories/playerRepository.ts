import { prisma } from "../db/prisma.js";

export function findPlayer() {
  return prisma.player.findFirst();
}

export function findLatestRank(queueType: string) {
  return prisma.rankSnapshot.findFirst({
    where: { queueType },
    orderBy: { takenAt: "desc" },
  });
}

export function findRankHistory(since: Date, queueType: string) {
  return prisma.rankSnapshot.findMany({
    where: { queueType, takenAt: { gte: since } },
    orderBy: { takenAt: "asc" },
  });
}

export function findRankLevels(queueType: string) {
  return prisma.rankSnapshot.groupBy({
    by: ["tier", "rank", "leaguePoints"],
    where: { queueType },
    _min: { takenAt: true },
  });
}
