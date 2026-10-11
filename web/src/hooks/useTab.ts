import { useEffect, useState } from "react";

export function useTab<T extends string>(tabs: readonly T[], fallback: T) {
  const readHash = () => {
    const hash = window.location.hash.slice(1) as T;
    return tabs.includes(hash) ? hash : fallback;
  };

  const [tab, setTab] = useState<T>(readHash);

  useEffect(() => {
    const onHashChange = () => setTab(readHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  });

  function selectTab(next: T) {
    window.history.pushState(null, "", `#${next}`);
    setTab(next);
  }

  return [tab, selectTab] as const;
}
