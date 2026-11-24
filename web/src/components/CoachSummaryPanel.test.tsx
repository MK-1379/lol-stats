import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CoachSummaryPanel } from "./CoachSummaryPanel";

function renderPanel(response: Response) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <CoachSummaryPanel />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CoachSummaryPanel", () => {
  it("muestra cada párrafo del resumen", async () => {
    const summary = {
      text: "Vas bien en línea.\n\nCéntrate en las peleas.",
      generatedAt: "2026-11-24T08:00:00.000Z",
      model: "openai/gpt-oss-120b",
    };
    renderPanel(new Response(JSON.stringify(summary), { status: 200 }));

    expect(await screen.findByText("Vas bien en línea.")).toBeInTheDocument();
    expect(screen.getByText("Céntrate en las peleas.")).toBeInTheDocument();
  });

  it("no muestra nada si la IA no está configurada", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ error: "No configurado" }), { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const queryClient = new QueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CoachSummaryPanel />
      </QueryClientProvider>,
    );

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
