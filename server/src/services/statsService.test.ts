import { describe, expect, it } from "vitest";
import { calculateKda, calculateWinrate, toTotalLp } from "./statsService.js";

describe("calculateKda", () => {
  it("suma kills y assists y divide entre las muertes", () => {
    expect(calculateKda(2, 9, 19)).toBe(2.33);
  });

  it("no divide entre 0 cuando no has muerto", () => {
    expect(calculateKda(5, 0, 10)).toBe(15);
  });
});

describe("calculateWinrate", () => {
  it("devuelve el porcentaje con un decimal", () => {
    expect(calculateWinrate(372, 722)).toBe(51.5);
  });

  it("devuelve 0 si no hay partidas", () => {
    expect(calculateWinrate(0, 0)).toBe(0);
  });
});

describe("toTotalLp", () => {
  it("convierte Diamante IV 18 LP en un número continuo", () => {
    expect(toTotalLp("DIAMOND", "IV", 18)).toBe(2418);
  });

  it("subir de división suma 100", () => {
    expect(toTotalLp("DIAMOND", "III", 18) - toTotalLp("DIAMOND", "IV", 18)).toBe(100);
  });

  it("Master no tiene divisiones", () => {
    expect(toTotalLp("MASTER", "I", 50)).toBe(2850);
  });
});
