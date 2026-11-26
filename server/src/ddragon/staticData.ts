import { z } from "zod";
import { HttpError } from "../middlewares/errorHandler.js";

const DDRAGON = "https://ddragon.leagueoflegends.com";
const LOCALE = "es_ES";
const CACHE_MS = 12 * 60 * 60 * 1000;

export const BASIC_BOOTS_ID = 1001;
export const COMPLETED_ITEM_MIN_GOLD = 2000;

const versionsSchema = z.array(z.string());

const itemsSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      name: z.string(),
      into: z.array(z.string()).optional(),
      tags: z.array(z.string()).default([]),
      gold: z.object({ total: z.number(), purchasable: z.boolean() }),
    }),
  ),
});

const runeSchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
});

const runeTreesSchema = z.array(
  runeSchema.extend({
    slots: z.array(z.object({ runes: z.array(runeSchema) })),
  }),
);

const spellsSchema = z.object({
  data: z.record(
    z.string(),
    z.object({
      key: z.string(),
      name: z.string(),
      image: z.object({ full: z.string() }),
    }),
  ),
});

export type StaticEntry = { id: number; name: string; icon: string };
export type ItemKind = "boots" | "completed" | "other";
export type ItemInfo = StaticEntry & { kind: ItemKind };

export type StaticData = {
  version: string;
  items: Map<number, ItemInfo>;
  runes: Map<number, StaticEntry>;
  spells: Map<number, StaticEntry>;
};

const STAT_MODS = `${DDRAGON}/cdn/img/perk-images/StatMods`;

export const SHARDS: StaticEntry[] = [
  {
    id: 5008,
    name: "Fuerza adaptable",
    icon: `${STAT_MODS}/StatModsAdaptiveForceIcon.png`,
  },
  {
    id: 5005,
    name: "Velocidad de ataque",
    icon: `${STAT_MODS}/StatModsAttackSpeedIcon.png`,
  },
  {
    id: 5007,
    name: "Velocidad de habilidades",
    icon: `${STAT_MODS}/StatModsCDRScalingIcon.png`,
  },
  {
    id: 5010,
    name: "Velocidad de movimiento",
    icon: `${STAT_MODS}/StatModsMovementSpeedIcon.png`,
  },
  {
    id: 5001,
    name: "Vida escalable",
    icon: `${STAT_MODS}/StatModsHealthScalingIcon.png`,
  },
  { id: 5011, name: "Vida", icon: `${STAT_MODS}/StatModsHealthPlusIcon.png` },
  { id: 5013, name: "Tenacidad", icon: `${STAT_MODS}/StatModsTenacityIcon.png` },
  { id: 5002, name: "Armadura", icon: `${STAT_MODS}/StatModsArmorIcon.png` },
  { id: 5003, name: "Resistencia mágica", icon: `${STAT_MODS}/StatModsMagicResIcon.png` },
];

export function classifyItem(
  id: number,
  item: {
    into?: string[];
    tags: string[];
    gold: { total: number; purchasable: boolean };
  },
): ItemKind {
  if (item.tags.includes("Boots")) {
    return id === BASIC_BOOTS_ID ? "other" : "boots";
  }

  const isFinal = !item.into || item.into.length === 0;
  if (isFinal && item.gold.purchasable && item.gold.total >= COMPLETED_ITEM_MIN_GOLD) {
    return "completed";
  }

  return "other";
}

export function parseItems(raw: unknown, version: string) {
  const { data } = itemsSchema.parse(raw);
  const items = new Map<number, ItemInfo>();

  for (const [key, item] of Object.entries(data)) {
    const id = Number(key);
    items.set(id, {
      id,
      name: item.name,
      icon: `${DDRAGON}/cdn/${version}/img/item/${key}.png`,
      kind: classifyItem(id, item),
    });
  }

  return items;
}

export function parseRunes(raw: unknown) {
  const runes = new Map<number, StaticEntry>();
  const toEntry = (rune: z.infer<typeof runeSchema>) => ({
    id: rune.id,
    name: rune.name,
    icon: `${DDRAGON}/cdn/img/${rune.icon}`,
  });

  for (const tree of runeTreesSchema.parse(raw)) {
    runes.set(tree.id, toEntry(tree));
    for (const rune of tree.slots.flatMap((slot) => slot.runes)) {
      runes.set(rune.id, toEntry(rune));
    }
  }

  for (const shard of SHARDS) {
    runes.set(shard.id, shard);
  }

  return runes;
}

export function parseSpells(raw: unknown, version: string) {
  const { data } = spellsSchema.parse(raw);
  const spells = new Map<number, StaticEntry>();

  for (const spell of Object.values(data)) {
    const id = Number(spell.key);
    spells.set(id, {
      id,
      name: spell.name,
      icon: `${DDRAGON}/cdn/${version}/img/spell/${spell.image.full}`,
    });
  }

  return spells;
}

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new HttpError(502, "Data Dragon no responde ahora mismo");
  }
  return response.json();
}

async function loadStaticData(): Promise<StaticData> {
  const [version] = versionsSchema.parse(await fetchJson(`${DDRAGON}/api/versions.json`));
  const base = `${DDRAGON}/cdn/${version}/data/${LOCALE}`;

  const [items, runes, spells] = await Promise.all([
    fetchJson(`${base}/item.json`),
    fetchJson(`${base}/runesReforged.json`),
    fetchJson(`${base}/summoner.json`),
  ]);

  return {
    version,
    items: parseItems(items, version),
    runes: parseRunes(runes),
    spells: parseSpells(spells, version),
  };
}

let cached: { data: StaticData; loadedAt: number } | null = null;
let pending: Promise<StaticData> | null = null;

export function clearStaticDataCache() {
  cached = null;
  pending = null;
}

export function getStaticData() {
  if (cached && Date.now() - cached.loadedAt < CACHE_MS) {
    return Promise.resolve(cached.data);
  }

  pending ??= loadStaticData()
    .then((data) => {
      cached = { data, loadedAt: Date.now() };
      return data;
    })
    .finally(() => {
      pending = null;
    });

  return pending;
}
