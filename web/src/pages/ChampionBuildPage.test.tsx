import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChampionBuild, GameEntry } from "../api/types";
import { ChampionBuildPage } from "./ChampionBuildPage";

const entry = (id: number, name: string): GameEntry => ({ id, name, icon: "" });

const build: ChampionBuild = {
  champion: { id: 267, key: "Nami", name: "Nami" },
  version: "16.23.1",
  position: "UTILITY",
  positions: [
    { position: "UTILITY", games: 7 },
    { position: "BOTTOM", games: 1 },
  ],
  games: 7,
  wins: 2,
  winrate: 28.6,
  sources: { own: 7, highElo: 0 },
  patches: ["16.23", "16.19"],
  runes: [
    {
      value: {
        primary: entry(8200, "Brujería"),
        secondary: entry(8300, "Inspiración"),
        perks: [
          entry(8214, "Invocar a Aery"),
          entry(8226, "Banda de maná"),
          entry(8210, "Trascendencia"),
          entry(8236, "Se avecina tormenta"),
          entry(8304, "Calzado mágico"),
          entry(8316, "Manitas"),
        ],
        shards: [entry(5008, "Fuerza adaptable"), entry(5008, "Fuerza adaptable"), entry(5001, "Vida escalable")],
      },
      games: 4,
      wins: 1,
      winrate: 25,
    },
  ],
  spells: [{ value: [entry(4, "Destello"), entry(7, "Curar")], games: 6, wins: 2, winrate: 33.3 }],
  startItems: [
    {
      value: [entry(2003, "Poción de vida"), entry(2003, "Poción de vida"), entry(3865, "Atlas mundial")],
      games: 6,
      wins: 1,
      winrate: 16.7,
    },
  ],
  boots: [{ value: entry(3158, "Botas jonias de la lucidez"), games: 3, wins: 1, winrate: 33.3 }],
  coreItems: [
    {
      value: [entry(6620, "Ecos de Helia"), entry(3504, "Incensario ardiente"), entry(6617, "Renovación de piedra lunar")],
      games: 1,
      wins: 1,
      winrate: 100,
    },
  ],
  lateItems: [],
  skills: { priority: "WEQ", sequence: "WEQWWRWEWEWREEQ", games: 5, winrate: 20 },
};

function renderPage(path: string, body: unknown, status = 200) {
  const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/campeon/:championKey" element={<ChampionBuildPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChampionBuildPage", () => {
  it("pide la build del campeón de la URL y muestra runas, objetos y habilidades", async () => {
    const fetchMock = renderPage("/campeon/Nami", build);

    expect(await screen.findByText("Invocar a Aery")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Nami" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/champions/Nami/build");
    expect(screen.getByRole("img", { name: "Ecos de Helia" })).toBeInTheDocument();
    expect(screen.getByText("Destello + Curar")).toBeInTheDocument();
    expect(screen.getByLabelText("Prioridad: W, E, Q")).toBeInTheDocument();
  });

  it("avisa de que la muestra es pequeña y de dónde salen las partidas", async () => {
    renderPage("/campeon/Nami", build);

    expect(await screen.findByText(/Muestra pequeña/)).toBeInTheDocument();
    expect(screen.getByText(/7 tuyas y 0 de jugadores Master\+/)).toBeInTheDocument();
  });

  it("agrupa los objetos iniciales repetidos", async () => {
    renderPage("/campeon/Nami", build);

    const items = await screen.findByRole("region", { name: "Objetos" });

    expect(within(items).getAllByRole("img", { name: "Poción de vida" })).toHaveLength(1);
    expect(within(items).getByText("2")).toBeInTheDocument();
  });

  it("cambia de posición guardándola en la URL", async () => {
    const fetchMock = renderPage("/campeon/Nami", build);

    await userEvent.click(await screen.findByRole("button", { name: /ADC/ }));

    expect(fetchMock).toHaveBeenLastCalledWith("/api/champions/Nami/build?position=BOTTOM");
  });

  it("muestra el error de la API si el campeón no existe", async () => {
    renderPage("/campeon/Noexiste", { error: "Campeón no encontrado" }, 404);

    expect(await screen.findByRole("alert")).toHaveTextContent("Campeón no encontrado");
  });
});
