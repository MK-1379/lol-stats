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

describe("partes de la puntuación", () => {
  it("enseña el valor real y el objetivo de cada parte", () => {
    const match = makeMatch({ kda: 2, deaths: 4, durationSeconds: 1800, visionScore: 60 });
    const parts = performanceScore(match).parts;

    expect(parts.find((part) => part.label === "KDA")).toMatchObject({ raw: "2", target: "5" });
    expect(parts.find((part) => part.label === "Muertes")).toMatchObject({ raw: "4", target: "0" });
    expect(parts.find((part) => part.label === "Visión")).toMatchObject({
      raw: "2/min",
      target: "2.5/min",
    });
  });

  it("usa farmeo en vez de asistencias fuera de support", () => {
    const match = makeMatch({ position: "MIDDLE", cs: 240, durationSeconds: 1800 });
    const labels = performanceScore(match).parts.map((part) => part.label);

    expect(labels).toEqual(["KDA", "Muertes", "Farmeo", "Visión", "Victoria"]);
    expect(performanceScore(match).parts[2]).toMatchObject({ raw: "8 CS/min", target: "9 CS/min" });
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

  it.each([
    [9.5, 4],
    [6.8, 3],
    [5.3, 2],
    [3.2, 1],
  ])("un %s está en el nivel %s", (score, level) => {
    expect(scoreTone(score).level).toBe(level);
  });
});
