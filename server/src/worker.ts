import cron from "node-cron";
import { env } from "./config/env.js";
import { syncChampions } from "./sync/syncChampions.js";
import { syncPlayer } from "./sync/syncPlayer.js";

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
  } catch (error) {
    console.error("[worker] Error sincronizando el jugador:", error);
  }
}

console.log("Worker iniciado");

await runChampionSync();
await runPlayerSync();

cron.schedule("*/30 * * * *", runPlayerSync);

cron.schedule("0 4 * * *", runChampionSync);
