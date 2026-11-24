import { createContext } from "react";
import type { QueueFilter } from "../utils/queue";

type QueueContextValue = {
  queue: QueueFilter;
  setQueue: (queue: QueueFilter) => void;
};

export const QueueContext = createContext<QueueContextValue>({
  queue: "all",
  setQueue: () => {},
});
