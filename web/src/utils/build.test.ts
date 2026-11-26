import { describe, expect, it } from "vitest";
import { groupRepeated, opggBuildUrl, patchRange, skillLevels } from "./build";

const potion = { id: 2003, name: "Poción de vida", icon: "" };
const atlas = { id: 3865, name: "Atlas mundial", icon: "" };

describe("groupRepeated", () => {
  it("agrupa los objetos repetidos manteniendo el orden", () => {
    expect(groupRepeated([atlas, potion, potion])).toEqual([
      { entry: atlas, count: 1 },
      { entry: potion, count: 2 },
    ]);
  });
});

describe("skillLevels", () => {
  it("devuelve en qué niveles se sube cada habilidad", () => {
    expect(skillLevels("QWEQQR")).toEqual([
      { skill: "Q", levels: [1, 4, 5] },
      { skill: "W", levels: [2] },
      { skill: "E", levels: [3] },
      { skill: "R", levels: [6] },
    ]);
  });
});

describe("patchRange", () => {
  it("describe uno o varios parches", () => {
    expect(patchRange([])).toBeNull();
    expect(patchRange(["16.23"])).toBe("parche 16.23");
    expect(patchRange(["16.23", "16.22", "16.19"])).toBe("parches 16.19 a 16.23");
  });
});

describe("opggBuildUrl", () => {
  it("usa la clave en minúsculas", () => {
    expect(opggBuildUrl("Nami")).toBe("https://op.gg/es/lol/champions/nami/build");
  });
});
