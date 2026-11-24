import {
  type QueueFilter,
  RANKED_QUEUES,
  type RankedQueue,
  rankedQueues,
} from "../config/queues.js";
import { HttpError } from "../middlewares/errorHandler.js";
import * as matchRepository from "../repositories/matchRepository.js";
import * as playerRepository from "../repositories/playerRepository.js";

export function calculateKda(kills: number, deaths: number, assists: number) {
  return round((kills + assists) / Math.max(1, deaths));
}

export function calculateWinrate(wins: number, games: number) {
  return games === 0 ? 0 : round((wins / games) * 100, 1);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

const TIERS = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"];
const DIVISIONS = ["IV", "III", "II", "I"];

export function toTotalLp(tier: string, rank: string, leaguePoints: number) {
  const tierIndex = TIERS.indexOf(tier);
  if (tierIndex === -1) {
    return TIERS.length * 400 + leaguePoints;
  }
  return tierIndex * 400 + DIVISIONS.indexOf(rank) * 100 + leaguePoints;
}

type RankLevel = {
  tier: string;
  rank: string;
  leaguePoints: number;
  reachedAt: Date;
};

export function findPeak(levels: RankLevel[]) {
  let peak: RankLevel | null = null;
  let peakLp = -1;

  for (const level of levels) {
    const totalLp = toTotalLp(level.tier, level.rank, level.leaguePoints);
    if (totalLp > peakLp || (totalLp === peakLp && peak && level.reachedAt < peak.reachedAt)) {
      peak = level;
      peakLp = totalLp;
    }
  }

  return peak;
}

async function getQueueRank(queue: RankedQueue) {
  const { queueType } = RANKED_QUEUES[queue];
  const [rank, levels] = await Promise.all([
    playerRepository.findLatestRank(queueType),
    playerRepository.findRankLevels(queueType),
  ]);

  if (!rank) {
    return null;
  }

  const peak = findPeak(
    levels.map((level) => ({
      tier: level.tier,
      rank: level.rank,
      leaguePoints: level.leaguePoints,
      reachedAt: level._min.takenAt ?? new Date(0),
    })),
  );

  return {
    queue,
    tier: rank.tier,
    rank: rank.rank,
    leaguePoints: rank.leaguePoints,
    wins: rank.wins,
    losses: rank.losses,
    peak,
  };
}

export async function getSummary(queue: QueueFilter) {
  const [player, ranks, games, wins, totals] = await Promise.all([
    playerRepository.findPlayer(),
    Promise.all(rankedQueues(queue).map(getQueueRank)),
    matchRepository.countMatches(queue),
    matchRepository.countWins(queue),
    matchRepository.sumKda(queue),
  ]);

  if (!player) {
    throw new HttpError(404, "Todavía no hay datos: espera a la primera sincronización");
  }

  const { kills, deaths, assists } = totals._sum;

  return {
    player: {
      gameName: player.gameName,
      tagLine: player.tagLine,
      profileIconId: player.profileIconId,
    },
    ranks: ranks.filter((rank) => rank !== null),
    stats: {
      games,
      wins,
      winrate: calculateWinrate(wins, games),
      kda: calculateKda(kills ?? 0, deaths ?? 0, assists ?? 0),
    },
  };
}

function queueName(queueId: number): RankedQueue {
  return queueId === RANKED_QUEUES.flex.queueId ? "flex" : "solo";
}

export async function getMatches(limit: number, offset: number, queue: QueueFilter) {
  const [rows, total] = await Promise.all([
    matchRepository.findMatches(limit, offset, queue),
    matchRepository.countMatches(queue),
  ]);

  return {
    total,
    limit,
    offset,
    items: rows.map((row) => ({
      matchId: row.matchId,
      queue: queueName(row.match.queueId),
      playedAt: row.match.gameCreation,
      durationSeconds: row.match.gameDuration,
      champion: row.champion.name,
      position: row.teamPosition,
      win: row.win,
      kills: row.kills,
      deaths: row.deaths,
      assists: row.assists,
      kda: calculateKda(row.kills, row.deaths, row.assists),
      cs: row.cs,
      visionScore: row.visionScore,
    })),
  };
}

const POSITION_ORDER = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

function positionIndex(position: string) {
  const index = POSITION_ORDER.indexOf(position);
  return index === -1 ? POSITION_ORDER.length : index;
}

export async function getScoreboard(matchId: string) {
  const [entries, player] = await Promise.all([
    matchRepository.findScoreboard(matchId),
    playerRepository.findPlayer(),
  ]);

  if (entries.length === 0) {
    throw new HttpError(404, "Esta partida todavía no tiene marcador");
  }

  const myTeamId = entries.find((entry) => entry.puuid === player?.puuid)?.teamId;
  const teamIds = [...new Set(entries.map((entry) => entry.teamId))].sort(
    (a, b) => Number(b === myTeamId) - Number(a === myTeamId) || a - b,
  );

  return {
    matchId,
    teams: teamIds.map((teamId) => {
      const players = entries
        .filter((entry) => entry.teamId === teamId)
        .sort((a, b) => positionIndex(a.teamPosition) - positionIndex(b.teamPosition));

      return {
        teamId,
        isMyTeam: teamId === myTeamId,
        win: players[0].win,
        kills: players.reduce((sum, entry) => sum + entry.kills, 0),
        goldEarned: players.reduce((sum, entry) => sum + entry.goldEarned, 0),
        players: players.map((entry) => ({
          gameName: entry.gameName,
          tagLine: entry.tagLine,
          isMe: entry.puuid === player?.puuid,
          champion: entry.champion.name,
          position: entry.teamPosition,
          champLevel: entry.champLevel,
          win: entry.win,
          kills: entry.kills,
          deaths: entry.deaths,
          assists: entry.assists,
          kda: calculateKda(entry.kills, entry.deaths, entry.assists),
          cs: entry.cs,
          visionScore: entry.visionScore,
          goldEarned: entry.goldEarned,
          damageToChampions: entry.damageToChampions,
        })),
      };
    }),
  };
}

export async function getChampionStats(queue: QueueFilter) {
  const [stats, wins] = await Promise.all([
    matchRepository.statsByChampion(queue),
    matchRepository.winsByChampion(queue),
  ]);

  const champions = await matchRepository.findChampionsByIds(
    stats.map((stat) => stat.championId),
  );

  const nameById = new Map(champions.map((c) => [c.id, c.name]));
  const winsById = new Map(wins.map((w) => [w.championId, w._count._all]));

  return stats
    .map((stat) => {
      const games = stat._count._all;
      const championWins = winsById.get(stat.championId) ?? 0;
      return {
        championId: stat.championId,
        champion: nameById.get(stat.championId) ?? "Desconocido",
        games,
        wins: championWins,
        winrate: calculateWinrate(championWins, games),
        kda: calculateKda(
          stat._sum.kills ?? 0,
          stat._sum.deaths ?? 0,
          stat._sum.assists ?? 0,
        ),
      };
    })
    .sort((a, b) => b.games - a.games);
}

export async function getRankHistory(days: number, queue: RankedQueue) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const snapshots = await playerRepository.findRankHistory(since, RANKED_QUEUES[queue].queueType);

  return snapshots.map((snapshot) => ({
    takenAt: snapshot.takenAt,
    tier: snapshot.tier,
    rank: snapshot.rank,
    leaguePoints: snapshot.leaguePoints,
    totalLp: toTotalLp(snapshot.tier, snapshot.rank, snapshot.leaguePoints),
  }));
}

export async function getTrends(last: number, queue: QueueFilter) {
  const rows = await matchRepository.findLastMatches(last, queue);

  return rows.reverse().map((row) => ({
    matchId: row.matchId,
    playedAt: row.match.gameCreation,
    win: row.win,
    kda: calculateKda(row.kills, row.deaths, row.assists),
    csPerMinute: round(row.cs / (row.match.gameDuration / 60), 1),
    visionScore: row.visionScore,
  }));
}
