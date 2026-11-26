import { toBuildSamples, toPatch } from "../builds/buildSample.js";
import { prisma } from "../db/prisma.js";
import { getMatch, getMatchTimeline } from "../riot/riotClient.js";

export type BuildSource = "own" | "highElo";

export async function saveBuildMatch(matchId: string, source: BuildSource) {
  const match = await getMatch(matchId);
  const timeline = await getMatchTimeline(matchId);

  await prisma.buildMatch.create({
    data: {
      matchId,
      source,
      patch: toPatch(match.info.gameVersion),
      queueId: match.info.queueId,
      gameCreation: new Date(match.info.gameCreation),
      samples: {
        createMany: { data: toBuildSamples(match, timeline) },
      },
    },
  });
}

export async function syncOwnBuilds() {
  const [ownMatches, savedMatches] = await Promise.all([
    prisma.match.findMany({
      select: { matchId: true },
      orderBy: { gameCreation: "desc" },
    }),
    prisma.buildMatch.findMany({ select: { matchId: true } }),
  ]);

  const savedIds = new Set(savedMatches.map((match) => match.matchId));
  const pending = ownMatches.filter((match) => !savedIds.has(match.matchId));
  let filled = 0;

  for (const { matchId } of pending) {
    try {
      await saveBuildMatch(matchId, "own");
      filled++;
    } catch (error) {
      console.error(`[builds] No se pudo guardar ${matchId}:`, error);
    }
  }

  return { filled, failed: pending.length - filled };
}
