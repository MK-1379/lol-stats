import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { Scoreboard } from "../api/types";

export function useScoreboard(matchId: string) {
  return useQuery({
    queryKey: ["scoreboard", matchId],
    queryFn: () => fetchJson<Scoreboard>(`/api/matches/${encodeURIComponent(matchId)}/scoreboard`),
    staleTime: Infinity,
  });
}
