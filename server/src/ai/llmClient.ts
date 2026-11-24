import { z } from "zod";
import { env } from "../config/env.js";

export class LlmApiError extends Error {
  constructor(
    public status: number,
    detail: string,
  ) {
    super(`La IA respondió ${status}: ${detail}`);
  }
}

const responseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable() }),
      }),
    )
    .min(1),
});

const MAX_RETRIES = 2;
const RETRYABLE_STATUS = [429, 500, 503];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isLlmConfigured() {
  return Boolean(env.AI_API_KEY);
}

export async function generateText(
  systemInstruction: string,
  prompt: string,
  attempt = 0,
): Promise<string> {
  const response = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (RETRYABLE_STATUS.includes(response.status) && attempt < MAX_RETRIES) {
    await sleep(2 ** attempt * 1000);
    return generateText(systemInstruction, prompt, attempt + 1);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new LlmApiError(response.status, body?.error?.message ?? "sin detalle");
  }

  const data = responseSchema.parse(await response.json());
  return (data.choices[0].message.content ?? "").replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}
