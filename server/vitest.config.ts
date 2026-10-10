import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      RIOT_API_KEY: "RGAPI-test",
      DATABASE_URL: "mysql://test:test@localhost:3306/test",
      RIOT_GAME_NAME: "Test",
      RIOT_TAG_LINE: "TEST",
    },
  },
});
