import { z } from "zod";
import {
  type BuildOption,
  computeBuild,
  countPositions,
  type SampleRow,
} from "../builds/buildStats.js";
import { getStaticData, type StaticEntry } from "../ddragon/staticData.js";
import { HttpError } from "../middlewares/errorHandler.js";
import * as buildRepository from "../repositories/buildRepository.js";

export const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;
export type Position = (typeof POSITIONS)[number];

const idList = z.array(z.number());

type SampleWithMatch = Awaited<
  ReturnType<typeof buildRepository.findBuildSamples>
>[number];

function toSampleRow(row: SampleWithMatch): SampleRow {
  return {
    ...row,
    perks: idList.parse(row.perks),
    shards: idList.parse(row.shards),
    startItems: idList.parse(row.startItems),
    itemOrder: idList.parse(row.itemOrder),
  };
}

function lookup(entries: Map<number, StaticEntry>, id: number): StaticEntry {
  return entries.get(id) ?? { id, name: `#${id}`, icon: "" };
}

function mapValue<T, U>(options: BuildOption<T>[], convert: (value: T) => U) {
  return options.map(({ value, ...stats }) => ({ ...stats, value: convert(value) }));
}

export async function getChampionBuild(championKey: string, position?: Position) {
  const champion = await buildRepository.findChampionByKey(championKey);
  if (!champion) {
    throw new HttpError(404, "Campeón no encontrado");
  }

  const [rows, staticData] = await Promise.all([
    buildRepository.findBuildSamples(champion.id),
    getStaticData(),
  ]);

  const samples = rows.map(toSampleRow);
  const positions = countPositions(samples);
  const selected = position ?? positions[0]?.position ?? null;
  const selectedRows = rows.filter((row) => row.teamPosition === selected);
  const selectedSamples = samples.filter((sample) => sample.teamPosition === selected);

  const classify = (id: number) => staticData.items.get(id)?.kind ?? "other";
  const build = computeBuild(selectedSamples, classify);

  const item = (id: number) => {
    const { name, icon } = lookup(staticData.items, id);
    return { id, name, icon };
  };
  const rune = (id: number) => lookup(staticData.runes, id);
  const spell = (id: number) => lookup(staticData.spells, id);

  return {
    champion: { id: champion.id, key: champion.key, name: champion.name },
    version: staticData.version,
    position: selected,
    positions,
    games: build.games,
    wins: build.wins,
    winrate: build.winrate,
    sources: {
      own: selectedRows.filter((row) => row.match.source === "own").length,
      highElo: selectedRows.filter((row) => row.match.source === "highElo").length,
    },
    patches: [...new Set(selectedRows.map((row) => row.match.patch))].sort().reverse(),
    runes: mapValue(build.runes, (page) => ({
      primary: rune(page.primaryStyle),
      secondary: rune(page.subStyle),
      perks: page.perks.map(rune),
      shards: page.shards.map(rune),
    })),
    spells: mapValue(build.spells, (ids) => ids.map(spell)),
    startItems: mapValue(build.startItems, (ids) => ids.map(item)),
    boots: mapValue(build.boots, item),
    coreItems: mapValue(build.coreItems, (ids) => ids.map(item)),
    lateItems: mapValue(build.lateItems, item),
    skills: build.skills,
  };
}
