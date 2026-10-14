import { describe, expect, it } from "vitest";
import { HEXAGON, hexagonFill } from "./hexagon";

describe("hexagonFill", () => {
  it("no rellena nada con un 0", () => {
    expect(hexagonFill(0)).toEqual([]);
  });

  it("rellena el hexágono entero con un 1", () => {
    expect(hexagonFill(1)).toEqual(HEXAGON);
  });

  it("corta a media altura con un 0.5", () => {
    const points = hexagonFill(0.5);
    const top = Math.min(...points.map(([, y]) => y));

    expect(top).toBe(16);
    expect(points).toContainEqual([16, 30]);
  });

  it("limita los valores fuera de rango", () => {
    expect(hexagonFill(1.4)).toEqual(HEXAGON);
    expect(hexagonFill(-1)).toEqual([]);
  });
});
