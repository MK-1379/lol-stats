import { describe, expect, it } from "vitest";
import { classifyItem, parseItems, parseRunes, parseSpells } from "./staticData.js";

const gold = (total: number, purchasable = true) => ({ total, purchasable });

describe("classifyItem", () => {
  it("las botas de nivel 2 son botas y las básicas no", () => {
    expect(classifyItem(3158, { tags: ["Boots"], gold: gold(900) })).toBe("boots");
    expect(classifyItem(1001, { tags: ["Boots"], gold: gold(300) })).toBe("other");
  });

  it("un objeto final y caro es un objeto completo", () => {
    expect(classifyItem(6617, { tags: [], into: [], gold: gold(2200) })).toBe(
      "completed",
    );
  });

  it("los componentes, los objetos baratos y los no comprables no cuentan", () => {
    expect(classifyItem(3067, { tags: [], into: ["6617"], gold: gold(800) })).toBe(
      "other",
    );
    expect(classifyItem(2003, { tags: [], gold: gold(50) })).toBe("other");
    expect(classifyItem(3869, { tags: [], gold: gold(2250, false) })).toBe("other");
  });
});

describe("parseItems", () => {
  it("crea la URL del icono con la versión", () => {
    const items = parseItems(
      {
        data: {
          "6617": {
            name: "Renovador piedra lunar",
            into: [],
            tags: [],
            gold: gold(2200),
          },
        },
      },
      "16.20.1",
    );

    expect(items.get(6617)).toEqual({
      id: 6617,
      name: "Renovador piedra lunar",
      icon: "https://ddragon.leagueoflegends.com/cdn/16.20.1/img/item/6617.png",
      kind: "completed",
    });
  });
});

describe("parseRunes", () => {
  it("incluye las ramas, las runas y los fragmentos", () => {
    const runes = parseRunes([
      {
        id: 8200,
        name: "Brujería",
        icon: "perk-images/Styles/7202_Sorcery.png",
        slots: [
          { runes: [{ id: 8214, name: "Invocar a Aery", icon: "perk-images/aery.png" }] },
        ],
      },
    ]);

    expect(runes.get(8200)?.icon).toBe(
      "https://ddragon.leagueoflegends.com/cdn/img/perk-images/Styles/7202_Sorcery.png",
    );
    expect(runes.get(8214)?.name).toBe("Invocar a Aery");
    expect(runes.get(5008)?.name).toBe("Fuerza adaptable");
  });
});

describe("parseSpells", () => {
  it("usa la key numérica como id", () => {
    const spells = parseSpells(
      {
        data: {
          SummonerFlash: {
            key: "4",
            name: "Destello",
            image: { full: "SummonerFlash.png" },
          },
        },
      },
      "16.20.1",
    );

    expect(spells.get(4)).toEqual({
      id: 4,
      name: "Destello",
      icon: "https://ddragon.leagueoflegends.com/cdn/16.20.1/img/spell/SummonerFlash.png",
    });
  });
});
