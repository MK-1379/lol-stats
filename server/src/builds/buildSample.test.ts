import { describe, expect, it } from "vitest";
import type {
  RiotMatch,
  RiotParticipant,
  RiotTimeline,
  RiotTimelineEvent,
} from "../riot/riotClient.js";
import {
  extractPurchases,
  extractSkillOrder,
  toBuildSamples,
  toPatch,
} from "./buildSample.js";

function participant(overrides: Partial<RiotParticipant> = {}): RiotParticipant {
  return {
    participantId: 1,
    puuid: "puuid-1",
    riotIdGameName: "Jugador",
    riotIdTagline: "EUW",
    teamId: 100,
    champLevel: 16,
    goldEarned: 12000,
    totalDamageDealtToChampions: 20000,
    championId: 267,
    championName: "Nami",
    teamPosition: "UTILITY",
    win: true,
    kills: 1,
    deaths: 3,
    assists: 20,
    totalMinionsKilled: 30,
    neutralMinionsKilled: 0,
    visionScore: 60,
    summoner1Id: 4,
    summoner2Id: 14,
    item0: 3853,
    item1: 0,
    item2: 6617,
    item3: 3158,
    item4: 0,
    item5: 0,
    perks: {
      statPerks: { offense: 5008, flex: 5008, defense: 5011 },
      styles: [
        {
          style: 8200,
          selections: [{ perk: 8214 }, { perk: 8226 }, { perk: 8210 }, { perk: 8237 }],
        },
        { style: 8300, selections: [{ perk: 8345 }, { perk: 8352 }] },
      ],
    },
    ...overrides,
  };
}

function event(overrides: Partial<RiotTimelineEvent>): RiotTimelineEvent {
  return { type: "ITEM_PURCHASED", timestamp: 0, participantId: 1, ...overrides };
}

describe("toPatch", () => {
  it("se queda con la versión mayor y menor", () => {
    expect(toPatch("15.23.712.4512")).toBe("15.23");
  });
});

describe("extractPurchases", () => {
  it("guarda las compras en orden", () => {
    const purchases = extractPurchases([
      event({ itemId: 3850, timestamp: 10 }),
      event({ itemId: 2003, timestamp: 20 }),
    ]);

    expect(purchases).toEqual([
      { itemId: 3850, timestamp: 10 },
      { itemId: 2003, timestamp: 20 },
    ]);
  });

  it("deshace la última compra del objeto cuando hay ITEM_UNDO", () => {
    const purchases = extractPurchases([
      event({ itemId: 2003, timestamp: 10 }),
      event({ itemId: 3850, timestamp: 20 }),
      event({ itemId: 2003, timestamp: 30 }),
      event({ type: "ITEM_UNDO", beforeId: 2003, timestamp: 40 }),
    ]);

    expect(purchases.map((purchase) => purchase.itemId)).toEqual([2003, 3850]);
  });
});

describe("extractSkillOrder", () => {
  it("convierte los niveles de habilidad en letras e ignora los EVOLVE", () => {
    const order = extractSkillOrder([
      event({ type: "SKILL_LEVEL_UP", skillSlot: 2, levelUpType: "NORMAL" }),
      event({ type: "SKILL_LEVEL_UP", skillSlot: 1, levelUpType: "NORMAL" }),
      event({ type: "SKILL_LEVEL_UP", skillSlot: 3, levelUpType: "EVOLVE" }),
      event({ type: "SKILL_LEVEL_UP", skillSlot: 4, levelUpType: "NORMAL" }),
    ]);

    expect(order).toBe("WQR");
  });
});

describe("toBuildSamples", () => {
  const match: RiotMatch = {
    metadata: { matchId: "EUW1_1" },
    info: {
      gameCreation: 0,
      gameDuration: 1800,
      gameVersion: "15.23.1.1",
      queueId: 420,
      participants: [
        participant(),
        participant({ participantId: 2, puuid: "puuid-2", championId: 22 }),
      ],
    },
  };

  const timeline: RiotTimeline = {
    info: {
      frames: [
        {
          events: [
            event({ itemId: 3850, timestamp: 5_000 }),
            event({ itemId: 2003, timestamp: 6_000 }),
            event({ participantId: 2, itemId: 1055, timestamp: 5_000 }),
            event({ type: "SKILL_LEVEL_UP", skillSlot: 2, levelUpType: "NORMAL" }),
          ],
        },
        {
          events: [
            event({ itemId: 3853, timestamp: 400_000 }),
            event({ itemId: 6617, timestamp: 900_000 }),
          ],
        },
      ],
    },
  };

  it("crea una muestra por jugador con solo sus eventos", () => {
    const samples = toBuildSamples(match, timeline);

    expect(samples).toHaveLength(2);
    expect(samples[1].startItems).toEqual([1055]);
    expect(samples[1].skillOrder).toBe("");
  });

  it("separa objetos iniciales, orden de compra, runas y objetos finales", () => {
    const [nami] = toBuildSamples(match, timeline);

    expect(nami).toMatchObject({
      championId: 267,
      teamPosition: "UTILITY",
      spell1: 4,
      spell2: 14,
      primaryStyle: 8200,
      subStyle: 8300,
      perks: [8214, 8226, 8210, 8237, 8345, 8352],
      shards: [5008, 5008, 5011],
      startItems: [3850, 2003],
      itemOrder: [3853, 6617],
      finalItems: [3853, 6617, 3158],
      skillOrder: "W",
    });
  });
});
