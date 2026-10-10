import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSummoner, RiotApiError } from "./riotClient.js";

const fetchMock = vi.fn();

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return new Response(JSON.stringify(body), { status, headers });
}

const summoner = { profileIconId: 29, summonerLevel: 500 };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("riotClient", () => {
  it("devuelve los datos validados cuando Riot responde 200", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(summoner));

    await expect(getSummoner("puuid-test")).resolves.toEqual(summoner);
  });

  it("envía la clave en la cabecera X-Riot-Token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(summoner));

    await getSummoner("puuid-test");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.headers["X-Riot-Token"]).toBe("RGAPI-test");
  });

  it("reintenta tras un 429 respetando Retry-After", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 429, { "Retry-After": "0" }))
      .mockResolvedValueOnce(jsonResponse(summoner));

    await expect(getSummoner("puuid-test")).resolves.toEqual(summoner);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("reintenta tras un error 500 de Riot", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse(summoner));

    await expect(getSummoner("puuid-test")).resolves.toEqual(summoner);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("no reintenta un 403 y lanza RiotApiError", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({}, 403));

    await expect(getSummoner("puuid-test")).rejects.toBeInstanceOf(RiotApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechaza una respuesta con un formato inesperado", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ profileIconId: "no soy un número", summonerLevel: 500 }),
    );

    await expect(getSummoner("puuid-test")).rejects.toThrow();
  });
});
