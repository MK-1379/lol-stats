import { prisma } from "../db/prisma.js";

const SOLO_QUEUE = "RANKED_SOLO_5x5";

export function findPlayer() {
  return prisma.player.findFirst();
}

export function findLatestRank() {
  return prisma.rankSnapshot.findFirst({
    where: { queueType: SOLO_QUEUE },
    orderBy: { takenAt: "desc" },
  });
}

export function findRankHistory(since: Date) {
  return prisma.rankSnapshot.findMany({
    where: { queueType: SOLO_QUEUE, takenAt: { gte: since } },
    orderBy: { takenAt: "asc" },
  });
}
