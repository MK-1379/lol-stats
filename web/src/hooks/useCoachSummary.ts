import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { CoachSummary } from "../api/types";

export function useCoachSummary() {
  return useQuery({
    queryKey: ["coach", "summary"],
    queryFn: () => fetchJson<CoachSummary>("/api/coach/summary"),
    retry: false,
    staleTime: 60 * 60 * 1000,
  });
}
