import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { Summary } from "../api/types";
import { useQueue } from "./useQueue";

export function useSummary() {
  const { queue } = useQueue();
  return useQuery({
    queryKey: ["summary", queue],
    queryFn: () => fetchJson<Summary>(`/api/summary?queue=${queue}`),
  });
}
