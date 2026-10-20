import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCountUp } from "./useCountUp";

function stubReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce, media: query }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCountUp", () => {
  it("empieza en 0 y llega al valor final", async () => {
    stubReducedMotion(false);
    const { result } = renderHook(() => useCountUp(2.48, 50));

    expect(result.current).toBe(0);
    await waitFor(() => expect(result.current).toBe(2.48));
  });

  it("devuelve el valor final directamente si se pide reducir el movimiento", () => {
    stubReducedMotion(true);
    const { result } = renderHook(() => useCountUp(67));

    expect(result.current).toBe(67);
  });
});
