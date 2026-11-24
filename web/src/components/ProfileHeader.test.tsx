import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Summary } from "../api/types";
import { QueueProvider } from "../context/QueueProvider";
import { ProfileHeader } from "./ProfileHeader";

const summary: Summary = {
  player: { gameName: "M0n0kuum44", tagLine: "SSJ", profileIconId: 1 },
  ranks: [],
  stats: { games: 0, wins: 0, winrate: 0, kda: 0 },
};

function renderHeader() {
  const fetchMock = vi.fn((url: string) =>
    Promise.resolve(
      new Response(JSON.stringify(url.startsWith("/api/summary") ? summary : []), { status: 200 }),
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <QueueProvider>
        <ProfileHeader tabs={null} />
      </QueueProvider>
    </QueryClientProvider>,
  );
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Filtro de cola", () => {
  it("empieza en SoloQ+Flex y pide los datos de las dos colas", async () => {
    const fetchMock = renderHeader();

    expect(await screen.findByRole("button", { name: "SoloQ+Flex" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/summary?queue=all");
  });

  it("al elegir Flex vuelve a pedir los datos y recuerda la elección", async () => {
    const user = userEvent.setup();
    const fetchMock = renderHeader();

    await user.click(await screen.findByRole("button", { name: "Flex" }));

    expect(screen.getByRole("button", { name: "Flex" })).toHaveAttribute("aria-pressed", "true");
    expect(fetchMock).toHaveBeenCalledWith("/api/summary?queue=flex");
    expect(fetchMock).toHaveBeenCalledWith("/api/champions?queue=flex");
    expect(fetchMock).toHaveBeenCalledWith("/api/rank-history?days=30&queue=flex");
    expect(localStorage.getItem("lolstats-queue")).toBe("flex");
  });
});
