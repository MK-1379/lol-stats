import type {
  RiotMatch,
  RiotParticipant,
  RiotTimeline,
  RiotTimelineEvent,
} from "../riot/riotClient.js";

export const START_ITEMS_WINDOW_MS = 90_000;
const SKILL_KEYS = ["Q", "W", "E", "R"];
const MAX_SKILL_LEVELS = 18;

export type Purchase = { itemId: number; timestamp: number };

export function toPatch(gameVersion: string) {
  return gameVersion.split(".").slice(0, 2).join(".");
}

export function extractPurchases(events: RiotTimelineEvent[]) {
  const purchases: Purchase[] = [];

  for (const event of events) {
    if (event.type === "ITEM_PURCHASED" && event.itemId) {
      purchases.push({ itemId: event.itemId, timestamp: event.timestamp });
    }

    if (event.type === "ITEM_UNDO" && event.beforeId) {
      const index = purchases
        .map((purchase) => purchase.itemId)
        .lastIndexOf(event.beforeId);
      if (index !== -1) purchases.splice(index, 1);
    }
  }

  return purchases;
}

export function extractSkillOrder(events: RiotTimelineEvent[]) {
  return events
    .filter(
      (event) =>
        event.type === "SKILL_LEVEL_UP" &&
        event.levelUpType === "NORMAL" &&
        event.skillSlot !== undefined &&
        event.skillSlot >= 1 &&
        event.skillSlot <= SKILL_KEYS.length,
    )
    .map((event) => SKILL_KEYS[(event.skillSlot ?? 1) - 1])
    .slice(0, MAX_SKILL_LEVELS)
    .join("");
}

function finalItems(participant: RiotParticipant) {
  return [
    participant.item0,
    participant.item1,
    participant.item2,
    participant.item3,
    participant.item4,
    participant.item5,
  ].filter((itemId) => itemId !== 0);
}

export function toBuildSamples(match: RiotMatch, timeline: RiotTimeline) {
  const events = timeline.info.frames.flatMap((frame) => frame.events);

  return match.info.participants.map((participant) => {
    const ownEvents = events.filter(
      (event) => event.participantId === participant.participantId,
    );
    const purchases = extractPurchases(ownEvents);
    const [primary, secondary] = participant.perks.styles;
    const { offense, flex, defense } = participant.perks.statPerks;

    return {
      puuid: participant.puuid,
      championId: participant.championId,
      teamPosition: participant.teamPosition,
      win: participant.win,
      spell1: participant.summoner1Id,
      spell2: participant.summoner2Id,
      primaryStyle: primary.style,
      subStyle: secondary.style,
      perks: [...primary.selections, ...secondary.selections].map(
        (selection) => selection.perk,
      ),
      shards: [offense, flex, defense],
      startItems: purchases
        .filter((purchase) => purchase.timestamp <= START_ITEMS_WINDOW_MS)
        .map((purchase) => purchase.itemId),
      itemOrder: purchases
        .filter((purchase) => purchase.timestamp > START_ITEMS_WINDOW_MS)
        .map((purchase) => purchase.itemId),
      finalItems: finalItems(participant),
      skillOrder: extractSkillOrder(ownEvents),
    };
  });
}
