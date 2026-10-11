import { useState } from "react";
import { formatTier } from "../utils/format";

const TIER_COLORS: Record<string, string> = {
  IRON: "#7b6a62",
  BRONZE: "#b0703a",
  SILVER: "#9aa8b4",
  GOLD: "#d8ab4f",
  PLATINUM: "#3fb3aa",
  EMERALD: "#2fb36a",
  DIAMOND: "#6c8cf0",
  MASTER: "#b05ad8",
  GRANDMASTER: "#dd5050",
  CHALLENGER: "#f2c955",
};

export function RankEmblem({ tier }: { tier: string }) {
  const [failed, setFailed] = useState(false);
  const name = formatTier(tier);

  if (failed) {
    const color = TIER_COLORS[tier] ?? "var(--gold)";
    return (
      <div
        role="img"
        aria-label={`Emblema de ${name}`}
        className="grid size-20 shrink-0 place-items-center [clip-path:polygon(50%_0,93%_25%,93%_75%,50%_100%,7%_75%,7%_25%)]"
        style={{
          background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 35%, black))`,
        }}
      >
        <span className="font-display text-stat font-bold text-white">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <img
      src={`/ranks/${tier.toLowerCase()}.png`}
      alt={`Emblema de ${name}`}
      width={80}
      height={80}
      onError={() => setFailed(true)}
      className="size-20 shrink-0 object-contain"
    />
  );
}
