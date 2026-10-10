import { config } from "dotenv";
import { z } from "zod";

config({ path: "../.env", quiet: true });

const envSchema = z.object({
  RIOT_API_KEY: z.string().startsWith("RGAPI-"),
  DATABASE_URL: z.string().startsWith("mysql://"),
});

export const env = envSchema.parse(process.env);