import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { ChampionStat, RankPoint, TrendPoint } from "../api/types";
import { rankHistoryQueue } from "../utils/queue";
import { useQueue } from "./useQueue";

export function useRankHistory(days = 30) {
  const rankQueue = rankHistoryQueue(useQueue().queue);
  return useQuery({
    queryKey: ["rank-history", days, rankQueue],
    queryFn: () => fetchJson<RankPoint[]>(`/api/rank-history?days=${days}&queue=${rankQueue}`),
    placeholderData: keepPreviousData,
  });
}

export function useChampionStats() {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["champions", queue],
    queryFn: () => fetchJson<ChampionStat[]>(`/api/champions?queue=${queue}`),
  });
}

export function useTrends(last = 20) {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["trends", last, queue],
    queryFn: () => fetchJson<TrendPoint[]>(`/api/trends?last=${last}&queue=${queue}`),
  });
}
