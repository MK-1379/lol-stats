import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { CoachSummary } from "../api/types";
import { useQueue } from "./useQueue";

export function useCoachSummary() {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["coach", "summary", queue],
    queryFn: () => fetchJson<CoachSummary>(`/api/coach/summary?queue=${queue}`),
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
}
