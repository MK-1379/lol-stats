import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { MatchPage } from "../api/types";
import { useQueue } from "./useQueue";

export const RECENT_MATCHES_LIMIT = 100;

export function useRecentMatches() {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["matches", "recent", RECENT_MATCHES_LIMIT, queue],
    queryFn: () =>
      fetchJson<MatchPage>(`/api/matches?limit=${RECENT_MATCHES_LIMIT}&offset=0&queue=${queue}`),
  });
}
