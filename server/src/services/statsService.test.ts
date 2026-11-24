import { describe, expect, it } from "vitest";
import { calculateKda, calculateWinrate, findPeak, toTotalLp } from "./statsService.js";

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

describe("findPeak", () => {
  const day = (n: number) => new Date(`2026-11-${String(n).padStart(2, "0")}T12:00:00Z`);

  it("devuelve null si no hay ningún rango guardado", () => {
    expect(findPeak([])).toBeNull();
  });

  it("elige el rango más alto aunque no sea el último", () => {
    const peak = findPeak([
      { tier: "GOLD", rank: "I", leaguePoints: 99, reachedAt: day(1) },
      { tier: "PLATINUM", rank: "IV", leaguePoints: 0, reachedAt: day(2) },
      { tier: "GOLD", rank: "II", leaguePoints: 50, reachedAt: day(3) },
    ]);

    expect(peak).toMatchObject({ tier: "PLATINUM", rank: "IV", leaguePoints: 0 });
  });

  it("en Master o más compara solo por LP", () => {
    const peak = findPeak([
      { tier: "DIAMOND", rank: "I", leaguePoints: 99, reachedAt: day(1) },
      { tier: "MASTER", rank: "I", leaguePoints: 120, reachedAt: day(2) },
      { tier: "MASTER", rank: "I", leaguePoints: 60, reachedAt: day(3) },
    ]);

    expect(peak).toMatchObject({ tier: "MASTER", leaguePoints: 120 });
  });

  it("si empata, se queda con la primera vez que lo alcanzaste", () => {
    const peak = findPeak([
      { tier: "SILVER", rank: "II", leaguePoints: 30, reachedAt: day(9) },
      { tier: "SILVER", rank: "II", leaguePoints: 30, reachedAt: day(4) },
    ]);

    expect(peak?.reachedAt).toEqual(day(4));
  });
});
