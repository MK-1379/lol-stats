import { prisma } from "../db/prisma.js";

export function findMatches(limit: number, offset: number) {
  return prisma.matchParticipant.findMany({
    orderBy: { match: { gameCreation: "desc" } },
    take: limit,
    skip: offset,
    include: { match: true, champion: true },
  });
}

export function countMatches() {
  return prisma.matchParticipant.count();
}

export function countWins() {
  return prisma.matchParticipant.count({ where: { win: true } });
}

export function sumKda() {
  return prisma.matchParticipant.aggregate({
    _sum: { kills: true, deaths: true, assists: true },
  });
}

export function statsByChampion() {
  return prisma.matchParticipant.groupBy({
    by: ["championId"],
    _count: { _all: true },
    _sum: { kills: true, deaths: true, assists: true },
  });
}

export function winsByChampion() {
  return prisma.matchParticipant.groupBy({
    by: ["championId"],
    where: { win: true },
    _count: { _all: true },
  });
}

export function findChampionsByIds(ids: number[]) {
  return prisma.champion.findMany({ where: { id: { in: ids } } });
}

export function findScoreboard(matchId: string) {
  return prisma.scoreboardEntry.findMany({
    where: { matchId },
    include: { champion: true },
  });
}

export function findLastMatches(last: number) {
  return prisma.matchParticipant.findMany({
    orderBy: { match: { gameCreation: "desc" } },
    take: last,
    include: { match: true },
  });
}
