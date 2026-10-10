import { HttpError } from "../middlewares/errorHandler.js";
import * as matchRepository from "../repositories/matchRepository.js";
import * as playerRepository from "../repositories/playerRepository.js";

// --- Cálculos reutilizables ---
export function calculateKda(kills: number, deaths: number, assists: number) {
  // Si no has muerto, dividimos entre 1 para no dividir entre 0
  return round((kills + assists) / Math.max(1, deaths));
}

export function calculateWinrate(wins: number, games: number) {
  return games === 0 ? 0 : round((wins / games) * 100, 1);
}

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// Convierte "DIAMOND IV 18 LP" en un único número que se puede dibujar en una gráfica
const TIERS = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"];
const DIVISIONS = ["IV", "III", "II", "I"];

export function toTotalLp(tier: string, rank: string, leaguePoints: number) {
  const tierIndex = TIERS.indexOf(tier);
  if (tierIndex === -1) {
    // MASTER, GRANDMASTER y CHALLENGER no tienen divisiones
    return TIERS.length * 400 + leaguePoints;
  }
  return tierIndex * 400 + DIVISIONS.indexOf(rank) * 100 + leaguePoints;
}

// --- Casos de uso de la API ---
export async function getSummary() {
  const [player, rank, games, wins, totals] = await Promise.all([
    playerRepository.findPlayer(),
    playerRepository.findLatestRank(),
    matchRepository.countMatches(),
    matchRepository.countWins(),
    matchRepository.sumKda(),
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
    rank: rank && {
      tier: rank.tier,
      rank: rank.rank,
      leaguePoints: rank.leaguePoints,
      wins: rank.wins,
      losses: rank.losses,
    },
    stats: {
      games,
      wins,
      winrate: calculateWinrate(wins, games),
      kda: calculateKda(kills ?? 0, deaths ?? 0, assists ?? 0),
    },
  };
}

export async function getMatches(limit: number, offset: number) {
  const [rows, total] = await Promise.all([
    matchRepository.findMatches(limit, offset),
    matchRepository.countMatches(),
  ]);

  return {
    total,
    limit,
    offset,
    items: rows.map((row) => ({
      matchId: row.matchId,
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

export async function getChampionStats() {
  const [stats, wins] = await Promise.all([
    matchRepository.statsByChampion(),
    matchRepository.winsByChampion(),
  ]);

  const champions = await matchRepository.findChampionsByIds(
    stats.map((stat) => stat.championId),
  );

  // Map: buscar por id sin recorrer el array cada vez (como un HashMap en Java)
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

export async function getRankHistory(days: number) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const snapshots = await playerRepository.findRankHistory(since);

  return snapshots.map((snapshot) => ({
    takenAt: snapshot.takenAt,
    tier: snapshot.tier,
    rank: snapshot.rank,
    leaguePoints: snapshot.leaguePoints,
    totalLp: toTotalLp(snapshot.tier, snapshot.rank, snapshot.leaguePoints),
  }));
}

export async function getTrends(last: number) {
  const rows = await matchRepository.findLastMatches(last);

  // Vienen de la más reciente a la más antigua; la gráfica las quiere en orden cronológico
  return rows.reverse().map((row) => ({
    matchId: row.matchId,
    playedAt: row.match.gameCreation,
    win: row.win,
    kda: calculateKda(row.kills, row.deaths, row.assists),
    csPerMinute: round(row.cs / (row.match.gameDuration / 60), 1),
    visionScore: row.visionScore,
  }));
}
