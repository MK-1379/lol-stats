import { syncChampions } from "../sync/syncChampions.js";
import { prisma } from "../db/prisma.js";

try {
  const result = await syncChampions();
  console.log(`Campeones sincronizados: ${result.count} (versión ${result.version})`);
} finally {
  await prisma.$disconnect();
}
