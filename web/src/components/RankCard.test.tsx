import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Summary } from "../api/types";
import { RankCard } from "./RankCard";

const baseSummary: Summary = {
  player: { gameName: "M0n0kuum44", tagLine: "SSJ", profileIconId: 1 },
  rank: { tier: "EMERALD", rank: "III", leaguePoints: 20, wins: 10, losses: 8 },
  peakRank: {
    tier: "EMERALD",
    rank: "II",
    leaguePoints: 45,
    reachedAt: "2026-11-10T10:00:00.000Z",
  },
  stats: { games: 18, wins: 10, winrate: 55.6, kda: 3.1 },
};

function renderWithSummary(summary: Summary) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(summary), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RankCard />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RankCard", () => {
  it("muestra el peak debajo del rango actual con la fecha en que se alcanzó", async () => {
    renderWithSummary(baseSummary);

    const peak = await screen.findByText(/Peak:/);
    expect(peak).toHaveTextContent("Esmeralda II · 45 LP");
    expect(peak).toHaveTextContent("10 nov");
  });

  it("avisa cuando el rango actual es el peak", async () => {
    renderWithSummary({
      ...baseSummary,
      peakRank: { tier: "EMERALD", rank: "III", leaguePoints: 20, reachedAt: "2026-11-24T10:00:00.000Z" },
    });

    expect(await screen.findByText(/ahora mismo/)).toBeInTheDocument();
  });

  it("no muestra la línea de peak si todavía no hay ninguno guardado", async () => {
    renderWithSummary({ ...baseSummary, peakRank: null });

    await screen.findByText("20 LP");
    expect(screen.queryByText(/Peak:/)).not.toBeInTheDocument();
  });
});
