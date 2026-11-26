import { config } from "dotenv";
import { z } from "zod";

config({ path: "../.env", quiet: true });

const envSchema = z.object({
  RIOT_API_KEY: z.string().startsWith("RGAPI-"),
  DATABASE_URL: z.string().startsWith("mysql://"),
  RIOT_GAME_NAME: z.string().min(1),
  RIOT_TAG_LINE: z.string().min(1),
  PORT: z.coerce.number().int().default(3000),
  CORS_ORIGINS: z.string().default("http://localhost:5173,http://localhost:8080"),
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),
  AI_API_KEY: z.string().default(""),
  AI_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  AI_MODEL: z.string().default("openai/gpt-oss-120b"),
  HIGH_ELO_MATCHES_PER_RUN: z.coerce.number().int().min(0).max(40).default(20),
});

export const env = envSchema.parse(process.env);
