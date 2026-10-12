import { describe, expect, it } from "vitest";
import {
  championIconUrl,
  csPerMinute,
  formatDuration,
  formatPosition,
  nextDivision,
  opggUrl,
} from "./format";

describe("formatDuration", () => {
  it("convierte segundos en minutos:segundos con dos cifras", () => {
    expect(formatDuration(1805)).toBe("30:05");
    expect(formatDuration(59)).toBe("0:59");
  });
});

describe("formatPosition", () => {
  it("traduce las posiciones de Riot y usa un guion si no la conoce", () => {
    expect(formatPosition("BOTTOM")).toBe("ADC");
    expect(formatPosition("")).toBe("—");
  });
});

describe("csPerMinute", () => {
  it("redondea a un decimal", () => {
    expect(csPerMinute(200, 1500)).toBe(8);
    expect(csPerMinute(155, 1800)).toBe(5.2);
  });
});

describe("nextDivision", () => {
  it("sube de división dentro del mismo tier", () => {
    expect(nextDivision("EMERALD", "II")).toBe("Esmeralda I");
  });

  it("pasa al tier siguiente desde la división I", () => {
    expect(nextDivision("GOLD", "I")).toBe("Platino IV");
    expect(nextDivision("DIAMOND", "I")).toBe("Maestro");
  });

  it("no hay división siguiente en Maestro o superior", () => {
    expect(nextDivision("MASTER", "I")).toBeNull();
  });
});

describe("championIconUrl", () => {
  it("usa la clave de Data Dragon para los nombres especiales", () => {
    expect(championIconUrl("Wukong")).toMatch(/\/MonkeyKing\.png$/);
    expect(championIconUrl("Kai'Sa")).toMatch(/\/Kaisa\.png$/);
    expect(championIconUrl("Lee Sin")).toMatch(/\/LeeSin\.png$/);
  });
});

describe("opggUrl", () => {
  it("codifica los espacios y caracteres especiales del Riot ID", () => {
    expect(opggUrl("sopa de macaco", "EUW")).toBe(
      "https://op.gg/lol/summoners/euw/sopa%20de%20macaco-EUW",
    );
    expect(opggUrl("Nüñez", "ES1")).toBe("https://op.gg/lol/summoners/euw/N%C3%BC%C3%B1ez-ES1");
  });
});
