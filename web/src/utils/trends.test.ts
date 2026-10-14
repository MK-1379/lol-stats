import { describe, expect, it } from "vitest";
import { divisionBands, formatLpChange, lpChange, rollingAverage } from "./trends";

describe("lpChange", () => {
  it("resta el primer valor al último", () => {
    expect(lpChange([2400, 2450, 2482])).toBe(82);
    expect(lpChange([2500, 2470])).toBe(-30);
  });

  it("devuelve 0 si no hay al menos dos puntos", () => {
    expect(lpChange([])).toBe(0);
    expect(lpChange([2400])).toBe(0);
  });
});

describe("formatLpChange", () => {
  it.each([
    [82, "+82 LP"],
    [-30, "−30 LP"],
    [0, "Sin cambios"],
  ])("%s se escribe %s", (change, text) => {
    expect(formatLpChange(change)).toBe(text);
  });
});

describe("rollingAverage", () => {
  it("hace la media de las últimas partidas disponibles", () => {
    expect(rollingAverage([2, 4, 6, 8, 10, 12], 5)).toEqual([2, 3, 4, 5, 6, 8]);
  });
});

describe("divisionBands", () => {
  it("crea una banda por cada 100 LP", () => {
    expect(divisionBands(2400, 2700)).toEqual([
      { from: 2400, to: 2500 },
      { from: 2500, to: 2600 },
      { from: 2600, to: 2700 },
    ]);
  });
});
