import cron from "node-cron";
import { env } from "./config/env.js";
import { syncChampions } from "./sync/syncChampions.js";
import { syncPlayer } from "./sync/syncPlayer.js";
import { syncScoreboards } from "./sync/scoreboard.js";
import { syncOwnBuilds } from "./sync/syncBuilds.js";
import { syncHighEloBuilds } from "./sync/syncHighElo.js";

async function runChampionSync() {
  try {
    const result = await syncChampions();
    console.log(`[worker] Campeones: ${result.count} (versión ${result.version})`);
  } catch (error) {
    console.error("[worker] Error sincronizando campeones:", error);
  }
}

async function runPlayerSync() {
  try {
    const result = await syncPlayer(env.RIOT_GAME_NAME, env.RIOT_TAG_LINE);
    console.log(
      `[worker] ${new Date().toISOString()} partidas nuevas: ${result.newMatches}`,
    );
    const scoreboards = await syncScoreboards();
    if (scoreboards.filled > 0) {
      console.log(`[worker] Marcadores completados: ${scoreboards.filled}`);
    }
    const builds = await syncOwnBuilds();
    if (builds.filled > 0) {
      console.log(`[worker] Builds guardadas: ${builds.filled}`);
    }
  } catch (error) {
    console.error("[worker] Error sincronizando el jugador:", error);
  }
}

async function runHighEloSync() {
  try {
    const result = await syncHighEloBuilds(env.HIGH_ELO_MATCHES_PER_RUN);
    console.log(
      `[worker] Alto elo: ${result.saved} partidas nuevas de ${result.players} jugadores, ${result.pruned} borradas`,
    );
  } catch (error) {
    console.error("[worker] Error recogiendo partidas de alto elo:", error);
  }
}

console.log("Worker iniciado");

await runChampionSync();
await runPlayerSync();

cron.schedule("*/30 * * * *", runPlayerSync);

cron.schedule("15 * * * *", runHighEloSync);

cron.schedule("0 4 * * *", runChampionSync);
