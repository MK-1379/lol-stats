import { describe, expect, it } from "vitest";
import { formatCoachTarget, formatCoachValue } from "./coach";

describe("formatCoachValue", () => {
  it("muestra la participación en kills como porcentaje", () => {
    expect(formatCoachValue("killParticipation", 0.48)).toBe("48%");
  });

  it("añade el signo + a las diferencias positivas", () => {
    expect(formatCoachValue("goldDiff", 1501.58)).toBe("+1502");
    expect(formatCoachValue("csDiffPerMinute", 0.89)).toBe("+0.9/min");
  });

  it("deja el signo - en las diferencias negativas", () => {
    expect(formatCoachValue("goldDiff", -320)).toBe("-320");
  });

  it("redondea las muertes a un decimal", () => {
    expect(formatCoachValue("deaths", 6.17)).toBe("6.2");
  });
});

describe("formatCoachTarget", () => {
  it("usa ≥ cuando más es mejor y ≤ cuando menos es mejor", () => {
    expect(formatCoachTarget("killParticipation", "higher", 0.55)).toBe("≥ 55%");
    expect(formatCoachTarget("deaths", "lower", 5)).toBe("≤ 5.0");
  });
});
