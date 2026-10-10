import { z } from "zod";
import { prisma } from "../db/prisma.js";

const DDRAGON = "https://ddragon.leagueoflegends.com";

const versionsSchema = z.array(z.string());

const championsSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      key: z.string(),
      id: z.string(),
      name: z.string(),
    }),
  ),
});

export async function syncChampions() {
  const versions = versionsSchema.parse(
    await (await fetch(`${DDRAGON}/api/versions.json`)).json(),
  );
  const latest = versions[0];

  const { data } = championsSchema.parse(
    await (await fetch(`${DDRAGON}/cdn/${latest}/data/en_US/champion.json`)).json(),
  );

  const champions = Object.values(data);

  for (const champion of champions) {
    await prisma.champion.upsert({
      where: { id: Number(champion.key) },
      update: { key: champion.id, name: champion.name },
      create: { id: Number(champion.key), key: champion.id, name: champion.name },
    });
  }

  return { version: latest, count: champions.length };
}
