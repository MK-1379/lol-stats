import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChampionMastery } from "../api/types";
import { MasteryCard } from "./MasteryCard";

const masteries: ChampionMastery[] = [
  { championId: 238, champion: "Zed", level: 97, points: 1054721, lastPlayedAt: "2026-11-23T18:00:00.000Z" },
  { championId: 157, champion: "Yasuo", level: 46, points: 531601, lastPlayedAt: "2026-11-19T18:00:00.000Z" },
  { championId: 67, champion: "Vayne", level: 47, points: 516737, lastPlayedAt: "2026-11-20T18:00:00.000Z" },
];

function renderWithMasteries(body: ChampionMastery[]) {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MasteryCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("MasteryCard", () => {
  it("muestra cada campeón con su nivel de maestría y sus puntos, en el orden de la API", async () => {
    renderWithMasteries(masteries);

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Zed");
    expect(items[0]).toHaveTextContent("1.054.721 pts");
    expect(screen.getByRole("img", { name: "Maestría nivel 97" })).toBeInTheDocument();
    expect(items[2]).toHaveTextContent("Vayne");
  });

  it("enlaza cada campeón con su página de build", async () => {
    renderWithMasteries(masteries);

    const link = await screen.findByRole("link", { name: "Ver build de Zed" });
    expect(link).toHaveAttribute("href", "/campeon/Zed");
  });

  it("avisa cuando todavía no hay maestrías sincronizadas", async () => {
    renderWithMasteries([]);

    expect(await screen.findByText(/Todavía no hay maestrías/)).toBeInTheDocument();
  });
});
