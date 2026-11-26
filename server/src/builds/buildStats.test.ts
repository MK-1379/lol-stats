import { describe, expect, it } from "vitest";
import type { ItemKind } from "../ddragon/staticData.js";
import {
  computeBuild,
  countPositions,
  type SampleRow,
  skillPriority,
  topOptions,
} from "./buildStats.js";

const BOOTS = 3158;
const KINDS: Record<number, ItemKind> = {
  [BOOTS]: "boots",
  6617: "completed",
  3504: "completed",
  6616: "completed",
  3107: "completed",
  3222: "completed",
};
const classify = (id: number) => KINDS[id] ?? "other";

function sample(overrides: Partial<SampleRow> = {}): SampleRow {
  return {
    teamPosition: "UTILITY",
    win: true,
    spell1: 14,
    spell2: 4,
    primaryStyle: 8200,
    subStyle: 8300,
    perks: [8214, 8226, 8210, 8237, 8345, 8352],
    shards: [5008, 5008, 5011],
    startItems: [3850, 2003, 2003],
    itemOrder: [1001, 3067, BOOTS, 6617, 2003, 3504, 6616, 3107],
    skillOrder: "WQEQQRQWQWRWWEEEE",
    ...overrides,
  };
}

describe("topOptions", () => {
  it("agrupa por valor, cuenta victorias y ordena por partidas", () => {
    const options = topOptions(
      [sample({ spell1: 4 }), sample({ spell1: 4, win: false }), sample({ spell1: 7 })],
      (row) => row.spell1,
      5,
    );

    expect(options).toEqual([
      { value: 4, games: 2, wins: 1, winrate: 50 },
      { value: 7, games: 1, wins: 1, winrate: 100 },
    ]);
  });

  it("ignora las filas en las que pick devuelve null", () => {
    expect(topOptions([sample()], () => null, 5)).toEqual([]);
  });
});

describe("countPositions", () => {
  it("cuenta las posiciones e ignora las vacías", () => {
    const positions = countPositions([
      sample(),
      sample(),
      sample({ teamPosition: "BOTTOM" }),
      sample({ teamPosition: "" }),
    ]);

    expect(positions).toEqual([
      { position: "UTILITY", games: 2 },
      { position: "BOTTOM", games: 1 },
    ]);
  });
});

describe("skillPriority", () => {
  it("ordena las habilidades por cuál llega antes a 5 puntos", () => {
    expect(skillPriority("WQEQQRQWQWRWWEEEE")).toBe("QWE");
  });

  it("si ninguna está al máximo ordena por puntos", () => {
    expect(skillPriority("QWEWWRW")).toBe("WQE");
  });
});

describe("computeBuild", () => {
  it("junta hechizos en el mismo orden aunque estén en teclas distintas", () => {
    const build = computeBuild([sample(), sample({ spell1: 4, spell2: 14 })], classify);

    expect(build.spells[0]).toMatchObject({ value: [4, 14], games: 2 });
  });

  it("calcula botas, objetos principales y objetos posteriores", () => {
    const build = computeBuild([sample(), sample({ win: false })], classify);

    expect(build.boots[0]).toMatchObject({ value: BOOTS, games: 2 });
    expect(build.coreItems[0]).toMatchObject({
      value: [6617, 3504, 6616],
      games: 2,
      winrate: 50,
    });
    expect(build.lateItems[0]).toMatchObject({ value: 3107, games: 2 });
    expect(build.startItems[0].value).toEqual([2003, 2003, 3850]);
  });

  it("no cuenta como build principal una partida con menos de 3 objetos completos", () => {
    const build = computeBuild([sample({ itemOrder: [6617, 3504] })], classify);

    expect(build.coreItems).toEqual([]);
  });

  it("devuelve la prioridad y la secuencia de habilidades", () => {
    const build = computeBuild([sample()], classify);

    expect(build.skills).toEqual({
      priority: "QWE",
      sequence: "WQEQQRQWQWRWWEE",
      games: 1,
      winrate: 100,
    });
  });

  it("sin muestras devuelve listas vacías", () => {
    const build = computeBuild([], classify);

    expect(build).toMatchObject({ games: 0, winrate: 0, runes: [], skills: null });
  });
});
