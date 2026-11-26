import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { ChampionBuild } from "../api/types";

export function useChampionBuild(championKey: string, position: string | null) {
  return useQuery({
    queryKey: ["champion-build", championKey.toLowerCase(), position],
    queryFn: () => {
      const query = position ? `?position=${encodeURIComponent(position)}` : "";
      return fetchJson<ChampionBuild>(
        `/api/champions/${encodeURIComponent(championKey)}/build${query}`,
      );
    },
    placeholderData: keepPreviousData,
  });
}
