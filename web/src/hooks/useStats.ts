import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { ChampionStat, RankPoint, TrendPoint } from "../api/types";

export function useRankHistory(days = 30) {
  return useQuery({
    queryKey: ["rank-history", days],
    queryFn: () => fetchJson<RankPoint[]>(`/api/rank-history?days=${days}`),
    placeholderData: keepPreviousData,
  });
}

export function useChampionStats() {
  return useQuery({
    queryKey: ["champions"],
    queryFn: () => fetchJson<ChampionStat[]>("/api/champions"),
  });
}

export function useTrends(last = 20) {
  return useQuery({
    queryKey: ["trends", last],
    queryFn: () => fetchJson<TrendPoint[]>(`/api/trends?last=${last}`),
  });
}
