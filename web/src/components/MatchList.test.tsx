import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Scoreboard } from "../api/types";
import { makeMatch } from "../test/factories";
import { MatchList } from "./MatchList";

const matches = [
  makeMatch({ matchId: "EUW1_1", champion: "Leona", position: "UTILITY", win: true }),
  makeMatch({ matchId: "EUW1_2", champion: "Akali", position: "MIDDLE", win: false }),
  makeMatch({ matchId: "EUW1_3", champion: "Syndra", position: "MIDDLE", win: true }),
];

function renderList(items = matches) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MatchList matches={items} />
    </QueryClientProvider>,
  );
}

function visibleChampions() {
  const list = screen.getByRole("list", { name: /partidas/i });
  return within(list)
    .getAllByRole("listitem")
    .map((item) => within(item).getByText(/^(Leona|Akali|Syndra)$/).textContent);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MatchList", () => {
  it("filtra por resultado", async () => {
    const user = userEvent.setup();
    renderList();

    await user.click(screen.getByRole("button", { name: /derrotas/i }));

    expect(visibleChampions()).toEqual(["Akali"]);
    expect(screen.getByRole("button", { name: /derrotas/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("filtra por posición y combina los dos filtros", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("Posición"), "MIDDLE");
    expect(visibleChampions()).toEqual(["Akali", "Syndra"]);

    await user.click(screen.getByRole("button", { name: /victorias/i }));
    expect(visibleChampions()).toEqual(["Syndra"]);
  });

  it("muestra un mensaje y permite quitar los filtros si no hay partidas", async () => {
    const user = userEvent.setup();
    renderList();

    await user.selectOptions(screen.getByLabelText("Posición"), "TOP");
    expect(screen.getByText(/no hay partidas con estos filtros/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /quitar filtros/i }));
    expect(visibleChampions()).toHaveLength(3);
  });

  it("enseña 10 partidas y carga 10 más con Mostrar más", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 15 }, (_, index) => makeMatch({ matchId: `EUW1_${index}` }));
    renderList(many);

    expect(screen.getByText("Mostrando 10 de 15")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /mostrar más/i }));

    expect(screen.getByText("Mostrando 15 de 15")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mostrar más/i })).toBeDisabled();
  });

  it("pide el marcador a la API solo al abrirlo", async () => {
    const user = userEvent.setup();
    const scoreboard: Scoreboard = {
      matchId: "EUW1_1",
      teams: [
        {
          teamId: 100,
          isMyTeam: true,
          win: true,
          kills: 20,
          goldEarned: 60000,
          players: [
            {
              gameName: "sopa de macaco",
              tagLine: "EUW",
              isMe: false,
              champion: "Jinx",
              position: "BOTTOM",
              champLevel: 15,
              win: true,
              kills: 9,
              deaths: 2,
              assists: 5,
              kda: 7,
              cs: 240,
              visionScore: 20,
              goldEarned: 14000,
              damageToChampions: 30000,
            },
          ],
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(scoreboard), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    renderList([matches[0]]);

    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /ver marcador/i }));

    const link = await screen.findByRole("link", { name: /sopa de macaco/i });
    expect(fetchMock).toHaveBeenCalledWith("/api/matches/EUW1_1/scoreboard");
    expect(link).toHaveAttribute("href", "https://op.gg/lol/summoners/euw/sopa%20de%20macaco-EUW");
    expect(screen.getByRole("button", { name: /ocultar marcador/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });
});
