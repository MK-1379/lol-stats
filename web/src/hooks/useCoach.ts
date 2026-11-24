import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { CoachReport } from "../api/types";
import { useQueue } from "./useQueue";

export function useCoach(last = 20) {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["coach", last, queue],
    queryFn: () => fetchJson<CoachReport>(`/api/coach?last=${last}&queue=${queue}`),
  });
}
