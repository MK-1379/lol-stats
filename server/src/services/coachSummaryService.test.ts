import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../ai/llmClient.js", () => ({
  isLlmConfigured: vi.fn(),
  generateText: vi.fn(),
}));

vi.mock("./coachService.js", () => ({
  getCoachReport: vi.fn(),
}));

import * as llmClient from "../ai/llmClient.js";
import { getCoachReport } from "./coachService.js";
import {
  buildCoachPrompt,
  clearCoachSummaryCache,
  getCoachSummary,
  todayKey,
} from "./coachSummaryService.js";

const report = {
  position: "MIDDLE",
  gamesAnalyzed: 12,
  winrate: 75,
  tips: [],
  strengths: [],
  weeklyGoal: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  clearCoachSummaryCache();
  vi.mocked(llmClient.isLlmConfigured).mockReturnValue(true);
  vi.mocked(getCoachReport).mockResolvedValue(report);
});

describe("getCoachSummary", () => {
  it("responde 503 si no hay clave de la IA", async () => {
    vi.mocked(llmClient.isLlmConfigured).mockReturnValue(false);

    await expect(getCoachSummary()).rejects.toMatchObject({ status: 503 });
    expect(llmClient.generateText).not.toHaveBeenCalled();
  });

  it("llama a la IA una sola vez al día", async () => {
    vi.mocked(llmClient.generateText).mockResolvedValue("Buen trabajo.");

    const first = await getCoachSummary();
    const second = await getCoachSummary();

    expect(first.text).toBe("Buen trabajo.");
    expect(second).toBe(first);
    expect(llmClient.generateText).toHaveBeenCalledTimes(1);
  });

  it("comparte la misma llamada si llegan dos peticiones a la vez", async () => {
    vi.mocked(llmClient.generateText).mockResolvedValue("Texto");

    await Promise.all([getCoachSummary(), getCoachSummary()]);

    expect(llmClient.generateText).toHaveBeenCalledTimes(1);
  });

  it("responde 502 y no guarda nada si la IA falla", async () => {
    vi.mocked(llmClient.generateText).mockRejectedValueOnce(new Error("429"));
    vi.mocked(llmClient.generateText).mockResolvedValueOnce("Ahora sí");

    await expect(getCoachSummary()).rejects.toMatchObject({ status: 502 });
    await expect(getCoachSummary()).resolves.toMatchObject({ text: "Ahora sí" });
  });
});

describe("buildCoachPrompt", () => {
  it("convierte la participación en kills a porcentaje legible", () => {
    const prompt = buildCoachPrompt({
      ...report,
      tips: [
        {
          metric: "killParticipation",
          label: "Participación en kills",
          direction: "higher",
          value: 0.48,
          target: 0.55,
          advice: "",
          inWins: 0.51,
          inLosses: null,
        },
      ],
    });

    expect(prompt).toContain('"tuMedia": "48 %"');
    expect(prompt).toContain('"enDerrotas": "sin datos"');
    expect(prompt).not.toContain("0.48");
  });

  it("usa coma decimal en el resto de métricas", () => {
    const prompt = buildCoachPrompt({
      ...report,
      strengths: [
        { metric: "deaths", label: "Muertes por partida", direction: "lower", value: 4.17, target: 5 },
      ],
    });

    expect(prompt).toContain('"tuMedia": "4,2"');
  });
});

describe("todayKey", () => {
  it("usa el día de España aunque en UTC aún sea el día anterior", () => {
    expect(todayKey(new Date("2026-11-24T23:30:00Z"))).toBe("2026-11-25");
  });
});
