import { afterEach, describe, expect, it, vi } from "vitest";
import { generateText, LlmApiError } from "./llmClient.js";

function completion(content: string | null) {
  return { choices: [{ message: { role: "assistant", content } }] };
}

function stubFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("generateText", () => {
  it("envía los mensajes en formato OpenAI con la clave como Bearer", async () => {
    const fetchMock = stubFetch(completion("Hola"));

    await generateText("Eres un coach", "Datos");

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.test/v1/chat/completions");
    expect(options.headers.Authorization).toBe("Bearer test-ai");
    expect(JSON.parse(options.body)).toEqual({
      model: "test-model",
      messages: [
        { role: "system", content: "Eres un coach" },
        { role: "user", content: "Datos" },
      ],
    });
  });

  it("quita el razonamiento <think> que añaden algunos modelos", async () => {
    stubFetch(completion("<think>a ver…</think>\nVas bien."));

    await expect(generateText("s", "p")).resolves.toBe("Vas bien.");
  });

  it("lanza LlmApiError con el motivo que da el proveedor", async () => {
    stubFetch({ error: { message: "Invalid API Key" } }, 401);

    const error = await generateText("s", "p").catch((caught) => caught);

    expect(error).toBeInstanceOf(LlmApiError);
    expect(error.message).toBe("La IA respondió 401: Invalid API Key");
  });

  it("reintenta cuando el proveedor está saturado", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(completion("Ok"))));
    vi.stubGlobal("fetch", fetchMock);

    const result = generateText("s", "p");
    await vi.runAllTimersAsync();

    await expect(result).resolves.toBe("Ok");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
