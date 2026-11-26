import { useLocation, useNavigate } from "react-router";

export function useTab<T extends string>(tabs: readonly T[], fallback: T) {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const current = hash.slice(1) as T;
  const tab = tabs.includes(current) ? current : fallback;

  function selectTab(next: T) {
    navigate({ hash: next });
  }

  return [tab, selectTab] as const;
}
