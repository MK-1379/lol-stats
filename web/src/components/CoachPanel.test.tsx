import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CoachReport } from "../api/types";
import { CoachPanel } from "./CoachPanel";

const report: CoachReport = {
  position: "MIDDLE",
  gamesAnalyzed: 12,
  winrate: 75,
  tips: [
    {
      metric: "killParticipation",
      label: "Participación en kills",
      direction: "higher",
      value: 0.48,
      target: 0.55,
      advice: "Participas poco en las peleas de tu equipo.",
      inWins: 0.51,
      inLosses: 0.39,
    },
    {
      metric: "deaths",
      label: "Muertes por partida",
      direction: "lower",
      value: 6.17,
      target: 5,
      advice: "Mueres demasiado.",
      inWins: 5.67,
      inLosses: 7.67,
    },
  ],
  strengths: [
    { metric: "goldDiff", label: "Diferencia de oro con tu rival", direction: "higher", value: 1501.58, target: 0 },
  ],
  weeklyGoal: {
    metric: "killParticipation",
    label: "Participación en kills",
    direction: "higher",
    target: 0.55,
    outOf: 10,
    currentHits: 3,
    requiredHits: 5,
  },
};

function renderPanel(response: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      Promise.resolve(
        url === "/api/coach/summary"
          ? new Response(JSON.stringify({ error: "No configurado" }), { status: 503 })
          : response,
      ),
    ),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CoachPanel />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CoachPanel", () => {
  it("muestra los consejos en orden con la comparación entre victorias y derrotas", async () => {
    renderPanel(new Response(JSON.stringify(report), { status: 200 }));

    const list = await screen.findByRole("list", { name: "Consejos" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole("heading")).toHaveTextContent("Participación en kills");
    expect(within(items[0]).getByText("51%")).toBeInTheDocument();
    expect(within(items[0]).getByText("39%")).toBeInTheDocument();
  });

  it("muestra el progreso del objetivo de la semana", async () => {
    renderPanel(new Response(JSON.stringify(report), { status: 200 }));

    expect(
      await screen.findByRole("img", { name: "Ahora lo cumples en 3 de 10. Objetivo: 5." }),
    ).toBeInTheDocument();
    expect(screen.getByText("+1502")).toBeInTheDocument();
  });

  it("explica que faltan partidas cuando la API responde 404", async () => {
    renderPanel(
      new Response(JSON.stringify({ error: "Necesito al menos 5 partidas" }), { status: 404 }),
    );

    expect(await screen.findByText("Necesito al menos 5 partidas")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
