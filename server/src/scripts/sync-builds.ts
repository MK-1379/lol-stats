import { prisma } from "../db/prisma.js";
import { syncOwnBuilds } from "../sync/syncBuilds.js";

try {
  const result = await syncOwnBuilds();
  console.log(`Partidas con build guardada: ${result.filled}`);
  if (result.failed > 0) console.log(`Partidas con error: ${result.failed}`);
} finally {
  await prisma.$disconnect();
}
