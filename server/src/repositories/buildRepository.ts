import { prisma } from "../db/prisma.js";

export function findChampionByKey(key: string) {
  return prisma.champion.findUnique({ where: { key } });
}

export function findBuildSamples(championId: number) {
  return prisma.buildSample.findMany({
    where: { championId },
    select: {
      teamPosition: true,
      win: true,
      spell1: true,
      spell2: true,
      primaryStyle: true,
      subStyle: true,
      perks: true,
      shards: true,
      startItems: true,
      itemOrder: true,
      skillOrder: true,
      match: { select: { source: true, patch: true } },
    },
  });
}
