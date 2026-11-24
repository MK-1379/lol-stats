import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { CoachReport } from "../api/types";

export function useCoach(last = 20) {
  return useQuery({
    queryKey: ["coach", last],
    queryFn: () => fetchJson<CoachReport>(`/api/coach?last=${last}`),
  });
}
