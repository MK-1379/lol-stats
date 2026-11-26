import { prisma } from "../db/prisma.js";
import { syncHighEloBuilds } from "../sync/syncHighElo.js";

try {
  const count = Number(process.argv[2] ?? 20);
  const result = await syncHighEloBuilds(count);
  console.log(`Jugadores consultados: ${result.players}`);
  console.log(`Partidas de alto elo guardadas: ${result.saved}`);
  if (result.failed > 0) console.log(`Partidas con error: ${result.failed}`);
  console.log(`Partidas antiguas borradas: ${result.pruned}`);
} finally {
  await prisma.$disconnect();
}
