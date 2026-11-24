export const QUEUE_FILTERS = ["all", "solo", "flex"] as const;
export type QueueFilter = (typeof QUEUE_FILTERS)[number];

export const RANKED_QUEUES = {
  solo: { queueId: 420, queueType: "RANKED_SOLO_5x5" },
  flex: { queueId: 440, queueType: "RANKED_FLEX_SR" },
} as const;
export type RankedQueue = keyof typeof RANKED_QUEUES;

export function queueIds(filter: QueueFilter) {
  if (filter === "all") {
    return [RANKED_QUEUES.solo.queueId, RANKED_QUEUES.flex.queueId];
  }
  return [RANKED_QUEUES[filter].queueId];
}

export function rankedQueues(filter: QueueFilter): RankedQueue[] {
  return filter === "all" ? ["solo", "flex"] : [filter];
}
