import { useState, type CSSProperties } from "react";
import { formatTier, tierColor } from "../utils/format";

export function RankEmblem({ tier }: { tier: string }) {
  const [failed, setFailed] = useState(false);
  const name = formatTier(tier);

  if (failed) {
    const color = tierColor(tier);
    return (
      <div
        role="img"
        aria-label={`Emblema de ${name}`}
        className="sheen grid size-20 shrink-0 place-items-center [clip-path:polygon(50%_0,93%_25%,93%_75%,50%_100%,7%_75%,7%_25%)]"
        style={{
          background: `linear-gradient(160deg, ${color}, color-mix(in srgb, ${color} 35%, black))`,
        }}
      >
        <span className="font-display text-stat font-bold text-white">{name.charAt(0)}</span>
      </div>
    );
  }

  const src = `/ranks/${tier.toLowerCase()}.png`;

  return (
    <span
      className="sheen size-20 shrink-0"
      style={{ "--sheen-mask": `url(${src})` } as CSSProperties}
    >
      <img
        src={src}
        alt={`Emblema de ${name}`}
        width={80}
        height={80}
        onError={() => setFailed(true)}
        className="size-20 object-contain"
      />
    </span>
  );
}
