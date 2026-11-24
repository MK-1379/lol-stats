import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RankInfo, Summary } from "../api/types";
import { RankCard } from "./RankCard";

const soloRank: RankInfo = {
  queue: "solo",
  tier: "EMERALD",
  rank: "III",
  leaguePoints: 20,
  wins: 10,
  losses: 8,
  peak: { tier: "EMERALD", rank: "II", leaguePoints: 45, reachedAt: "2026-11-10T10:00:00.000Z" },
};

const flexRank: RankInfo = {
  queue: "flex",
  tier: "GOLD",
  rank: "I",
  leaguePoints: 70,
  wins: 4,
  losses: 2,
  peak: null,
};

function makeSummary(ranks: RankInfo[]): Summary {
  return {
    player: { gameName: "M0n0kuum44", tagLine: "SSJ", profileIconId: 1 },
    ranks,
    stats: { games: 18, wins: 10, winrate: 55.6, kda: 3.1 },
  };
}

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
    renderWithSummary(makeSummary([soloRank]));

    const peak = await screen.findByText(/Peak:/);
    expect(peak).toHaveTextContent("Esmeralda II · 45 LP");
    expect(peak).toHaveTextContent("10 nov");
  });

  it("avisa cuando el rango actual es el peak", async () => {
    renderWithSummary(
      makeSummary([
        {
          ...soloRank,
          peak: { tier: "EMERALD", rank: "III", leaguePoints: 20, reachedAt: "2026-11-24T10:00:00.000Z" },
        },
      ]),
    );

    expect(await screen.findByText(/ahora mismo/)).toBeInTheDocument();
  });

  it("no muestra la línea de peak si todavía no hay ninguno guardado", async () => {
    renderWithSummary(makeSummary([{ ...soloRank, peak: null }]));

    await screen.findByText("20 LP");
    expect(screen.queryByText(/Peak:/)).not.toBeInTheDocument();
  });

  it("pinta una tarjeta por cada cola en la que estás clasificado", async () => {
    renderWithSummary(makeSummary([soloRank, flexRank]));

    expect(await screen.findByText("Clasificatoria Solo/Dúo")).toBeInTheDocument();
    expect(screen.getByText("Clasificatoria Flexible")).toBeInTheDocument();
    expect(screen.getByText("70 LP")).toBeInTheDocument();
  });

  it("dice que no estás clasificado si no hay ningún rango", async () => {
    renderWithSummary(makeSummary([]));

    expect(await screen.findByText("Sin clasificar esta temporada.")).toBeInTheDocument();
  });
});
