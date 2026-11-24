import { type QueueFilter, queueIds } from "../config/queues.js";
import { prisma } from "../db/prisma.js";

function byQueue(queue: QueueFilter) {
  return { match: { queueId: { in: queueIds(queue) } } };
}

export function findMatches(limit: number, offset: number, queue: QueueFilter) {
  return prisma.matchParticipant.findMany({
    where: byQueue(queue),
    orderBy: { match: { gameCreation: "desc" } },
    take: limit,
    skip: offset,
    include: { match: true, champion: true },
  });
}

export function countMatches(queue: QueueFilter) {
  return prisma.matchParticipant.count({ where: byQueue(queue) });
}

export function countWins(queue: QueueFilter) {
  return prisma.matchParticipant.count({ where: { ...byQueue(queue), win: true } });
}

export function sumKda(queue: QueueFilter) {
  return prisma.matchParticipant.aggregate({
    where: byQueue(queue),
    _sum: { kills: true, deaths: true, assists: true },
  });
}

export function statsByChampion(queue: QueueFilter) {
  return prisma.matchParticipant.groupBy({
    by: ["championId"],
    where: byQueue(queue),
    _count: { _all: true },
    _sum: { kills: true, deaths: true, assists: true },
  });
}

export function winsByChampion(queue: QueueFilter) {
  return prisma.matchParticipant.groupBy({
    by: ["championId"],
    where: { ...byQueue(queue), win: true },
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

export function findLastMatches(last: number, queue: QueueFilter) {
  return prisma.matchParticipant.findMany({
    where: byQueue(queue),
    orderBy: { match: { gameCreation: "desc" } },
    take: last,
    include: { match: true },
  });
}

export function findCoachMatches(last: number, queue: QueueFilter) {
  return prisma.matchParticipant.findMany({
    where: byQueue(queue),
    orderBy: { match: { gameCreation: "desc" } },
    take: last,
    include: { match: { include: { scoreboard: true } } },
  });
}
