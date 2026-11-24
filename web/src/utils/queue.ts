export type QueueFilter = "all" | "solo" | "flex";
export type RankedQueue = "solo" | "flex";

export const QUEUE_OPTIONS: { value: QueueFilter; label: string }[] = [
  { value: "all", label: "SoloQ+Flex" },
  { value: "solo", label: "SoloQ" },
  { value: "flex", label: "Flex" },
];

const QUEUE_NAMES: Record<RankedQueue, string> = {
  solo: "Clasificatoria Solo/Dúo",
  flex: "Clasificatoria Flexible",
};

export function queueName(queue: RankedQueue) {
  return QUEUE_NAMES[queue];
}

export function rankHistoryQueue(queue: QueueFilter): RankedQueue {
  return queue === "flex" ? "flex" : "solo";
}

export function isQueueFilter(value: unknown): value is QueueFilter {
  return QUEUE_OPTIONS.some((option) => option.value === value);
}
