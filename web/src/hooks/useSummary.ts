import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "../api/client";
import type { Summary } from "../api/types";

export function useSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () => fetchJson<Summary>("/api/summary"),
  });
}
