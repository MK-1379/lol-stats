import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { MatchPage } from "../api/types";

export const RECENT_MATCHES_LIMIT = 100;

export function useRecentMatches() {
  return useQuery({
    queryKey: ["matches", "recent", RECENT_MATCHES_LIMIT],
    queryFn: () => fetchJson<MatchPage>(`/api/matches?limit=${RECENT_MATCHES_LIMIT}&offset=0`),
  });
}
