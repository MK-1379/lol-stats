import { useState } from "react";
import type { GameEntry } from "../../api/types";

const SIZES = {
  sm: "size-6",
  md: "size-9",
  lg: "size-11",
};

type GameIconProps = {
  entry: GameEntry;
  size?: keyof typeof SIZES;
  round?: boolean;
};

export function GameIcon({ entry, size = "md", round = false }: GameIconProps) {
  const [failed, setFailed] = useState(false);
  const shape = `${SIZES[size]} shrink-0 ${round ? "rounded-full" : "rounded-ui"}`;

  if (failed || !entry.icon) {
    return (
      <span
        role="img"
        aria-label={entry.name}
        title={entry.name}
        className={`${shape} grid place-items-center bg-panel-2 text-caption font-bold text-muted`}
      >
        {entry.name.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={entry.icon}
      alt={entry.name}
      title={entry.name}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${shape} bg-panel-2 object-cover`}
    />
  );
}
