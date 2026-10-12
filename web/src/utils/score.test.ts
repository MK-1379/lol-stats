import { describe, expect, it } from "vitest";
import { makeMatch } from "../test/factories";
import { performanceScore, scoreTone } from "./score";

describe("performanceScore", () => {
  it("da un 10 a una partida perfecta", () => {
    const match = makeMatch({ kda: 10, deaths: 0, visionScore: 120, assists: 20, win: true });

    expect(performanceScore(match).score).toBe(10);
  });

  it("da un 0 a la peor partida posible", () => {
    const match = makeMatch({ kda: 0, deaths: 12, visionScore: 0, assists: 0, win: false });

    expect(performanceScore(match).score).toBe(0);
  });

  it("valora la visión y las asistencias en support, y el farmeo en el resto", () => {
    const support = performanceScore(makeMatch({ position: "UTILITY" }));
    const mid = performanceScore(makeMatch({ position: "MIDDLE" }));

    expect(support.parts.map((part) => part.label)).toContain("Asistencias");
    expect(support.parts.map((part) => part.label)).not.toContain("Farmeo");
    expect(mid.parts.map((part) => part.label)).toContain("Farmeo");
  });

  it("los pesos suman 1 en cualquier posición", () => {
    for (const position of ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]) {
      const { parts } = performanceScore(makeMatch({ position }));
      const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0);

      expect(totalWeight).toBeCloseTo(1);
    }
  });
});

describe("scoreTone", () => {
  it.each([
    [8, "Excelente"],
    [6.5, "Buena"],
    [4, "Normal"],
    [3.9, "Floja"],
  ])("un %s es %s", (score, label) => {
    expect(scoreTone(score).label).toBe(label);
  });
});
