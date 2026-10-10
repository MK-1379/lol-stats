import {
  getAccountByRiotId,
  getMatchIds,
  getMatch,
  getRankEntries,
} from "../riot/riotClient.js";

const account = await getAccountByRiotId("M0n0kuum44", "SSJ");
const ids = await getMatchIds(account.puuid, 3);
console.log("Últimas partidas:", ids);

const match = await getMatch(ids[0]);
const me = match.info.participants.find((p) => p.puuid === account.puuid);
console.log(me);

const ranks = await getRankEntries(account.puuid);
console.log(ranks);
