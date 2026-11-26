import type { GameEntry } from "../api/types";

export const SKILL_KEYS = ["Q", "W", "E", "R"] as const;

export function groupRepeated(entries: GameEntry[]) {
  const groups: { entry: GameEntry; count: number }[] = [];
  for (const entry of entries) {
    const group = groups.find((current) => current.entry.id === entry.id);
    if (group) group.count++;
    else groups.push({ entry, count: 1 });
  }
  return groups;
}

export function skillLevels(sequence: string) {
  return SKILL_KEYS.map((skill) => ({
    skill,
    levels: [...sequence].flatMap((current, index) => (current === skill ? [index + 1] : [])),
  }));
}

export function patchRange(patches: string[]) {
  if (patches.length === 0) return null;
  if (patches.length === 1) return `parche ${patches[0]}`;
  return `parches ${patches.at(-1)} a ${patches[0]}`;
}

export function opggBuildUrl(championKey: string) {
  return `https://op.gg/es/lol/champions/${championKey.toLowerCase()}/build`;
}
