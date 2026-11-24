import { useContext } from "react";
import { QueueContext } from "../context/queueContext";

export function useQueue() {
  return useContext(QueueContext);
}
