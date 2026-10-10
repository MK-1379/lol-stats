import { env } from "../config/env.js";

const url =
  "https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/M0n0kuum44/SSJ";

const response = await fetch(url, {
  headers: { "X-Riot-Token": env.RIOT_API_KEY },
});

console.log("Status:", response.status);
console.log(await response.json());