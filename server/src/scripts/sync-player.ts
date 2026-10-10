import { syncPlayer } from "../sync/syncPlayer.js";
import { prisma } from "../db/prisma.js";

try {
  const result = await syncPlayer("M0n0kuum44", "SSJ");
  console.log(`Partidas nuevas: ${result.newMatches}`);
  console.log("Rango SoloQ:", result.rank);
} finally {
  await prisma.$disconnect();
}
