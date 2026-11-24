import { syncPlayer } from "../sync/syncPlayer.js";
import { prisma } from "../db/prisma.js";

try {
  const count = Number(process.argv[2] ?? 20);
  const result = await syncPlayer("M0n0kuum44", "SSJ", count);
  console.log(`Partidas nuevas: ${result.newMatches}`);
  console.log("Rangos:", result.ranks);
} finally {
  await prisma.$disconnect();
}
