import type { ItemKind } from "../ddragon/staticData.js";
import { calculateWinrate } from "../services/statsService.js";

export type SampleRow = {
  teamPosition: string;
  win: boolean;
  spell1: number;
  spell2: number;
  primaryStyle: number;
  subStyle: number;
  perks: number[];
  shards: number[];
  startItems: number[];
  itemOrder: number[];
  skillOrder: string;
};

export type ClassifyItem = (itemId: number) => ItemKind;

export type BuildOption<T> = {
  value: T;
  games: number;
  wins: number;
  winrate: number;
};

export type RunePage = {
  primaryStyle: number;
  subStyle: number;
  perks: number[];
  shards: number[];
};

export const CORE_SIZE = 3;
export const SKILL_SEQUENCE_LEVELS = 15;
const MIN_LEVELS_FOR_PRIORITY = 9;
const MAX_SKILL_POINTS = 5;
const BASIC_SKILLS = ["Q", "W", "E"];

const byId = (a: number, b: number) => a - b;

export function topOptions<Row extends { win: boolean }, T>(
  rows: Row[],
  pick: (row: Row) => T | null,
  limit: number,
): BuildOption<T>[] {
  const groups = new Map<string, BuildOption<T>>();

  for (const row of rows) {
    const value = pick(row);
    if (value === null) continue;

    const key = JSON.stringify(value);
    const group = groups.get(key) ?? { value, games: 0, wins: 0, winrate: 0 };
    group.games++;
    if (row.win) group.wins++;
    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => ({ ...group, winrate: calculateWinrate(group.wins, group.games) }))
    .sort((a, b) => b.games - a.games || b.winrate - a.winrate)
    .slice(0, limit);
}

export function countPositions(samples: SampleRow[]) {
  const counts = new Map<string, number>();
  for (const { teamPosition } of samples) {
    if (!teamPosition) continue;
    counts.set(teamPosition, (counts.get(teamPosition) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([position, games]) => ({ position, games }))
    .sort((a, b) => b.games - a.games);
}

export function completedItems(sample: SampleRow, classify: ClassifyItem) {
  const items = sample.itemOrder.filter((id) => classify(id) === "completed");
  return [...new Set(items)];
}

export function skillPriority(skillOrder: string) {
  const points = new Map(BASIC_SKILLS.map((skill) => [skill, 0]));
  const maxedAt = new Map<string, number>();

  [...skillOrder].forEach((skill, level) => {
    if (!points.has(skill)) return;
    const total = (points.get(skill) ?? 0) + 1;
    points.set(skill, total);
    if (total === MAX_SKILL_POINTS) maxedAt.set(skill, level);
  });

  return [...BASIC_SKILLS]
    .sort(
      (a, b) =>
        (maxedAt.get(a) ?? Infinity) - (maxedAt.get(b) ?? Infinity) ||
        (points.get(b) ?? 0) - (points.get(a) ?? 0),
    )
    .join("");
}

function itemsAfterCore(samples: SampleRow[], classify: ClassifyItem, limit: number) {
  const rows = samples.flatMap((sample) =>
    completedItems(sample, classify)
      .slice(CORE_SIZE)
      .map((itemId) => ({ win: sample.win, itemId })),
  );

  return topOptions(rows, (row) => row.itemId, limit);
}

function skills(samples: SampleRow[]) {
  const [priority] = topOptions(
    samples,
    (sample) =>
      sample.skillOrder.length >= MIN_LEVELS_FOR_PRIORITY
        ? skillPriority(sample.skillOrder)
        : null,
    1,
  );
  if (!priority) return null;

  const [sequence] = topOptions(
    samples.filter((sample) => skillPriority(sample.skillOrder) === priority.value),
    (sample) =>
      sample.skillOrder.length >= SKILL_SEQUENCE_LEVELS
        ? sample.skillOrder.slice(0, SKILL_SEQUENCE_LEVELS)
        : null,
    1,
  );

  return {
    priority: priority.value,
    sequence: sequence?.value ?? null,
    games: priority.games,
    winrate: priority.winrate,
  };
}

export function computeBuild(samples: SampleRow[], classify: ClassifyItem) {
  const wins = samples.filter((sample) => sample.win).length;

  return {
    games: samples.length,
    wins,
    winrate: calculateWinrate(wins, samples.length),
    runes: topOptions<SampleRow, RunePage>(
      samples,
      ({ primaryStyle, subStyle, perks, shards }) => ({
        primaryStyle,
        subStyle,
        perks,
        shards,
      }),
      2,
    ),
    spells: topOptions(samples, (sample) => [sample.spell1, sample.spell2].sort(byId), 2),
    startItems: topOptions(
      samples,
      (sample) =>
        sample.startItems.length > 0 ? [...sample.startItems].sort(byId) : null,
      2,
    ),
    boots: topOptions(
      samples,
      (sample) => sample.itemOrder.find((id) => classify(id) === "boots") ?? null,
      2,
    ),
    coreItems: topOptions(
      samples,
      (sample) => {
        const items = completedItems(sample, classify);
        return items.length >= CORE_SIZE ? items.slice(0, CORE_SIZE) : null;
      },
      3,
    ),
    lateItems: itemsAfterCore(samples, classify, 5),
    skills: skills(samples),
  };
}
