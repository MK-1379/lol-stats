import { useState, type ReactNode } from "react";
import { isQueueFilter, type QueueFilter } from "../utils/queue";
import { QueueContext } from "./queueContext";

const STORAGE_KEY = "lolstats-queue";

function readSavedQueue(): QueueFilter {
  const saved = localStorage.getItem(STORAGE_KEY);
  return isQueueFilter(saved) ? saved : "all";
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueueState] = useState<QueueFilter>(readSavedQueue);

  function setQueue(next: QueueFilter) {
    localStorage.setItem(STORAGE_KEY, next);
    setQueueState(next);
  }

  return <QueueContext value={{ queue, setQueue }}>{children}</QueueContext>;
}
