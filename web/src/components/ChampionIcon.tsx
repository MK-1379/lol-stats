import { useState } from "react";
import { championIconUrl } from "../utils/format";

type ChampionIconProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "size-7 text-meta",
  md: "size-9 text-small",
  lg: "size-12 text-base",
};

export function ChampionIcon({ name, size = "md" }: ChampionIconProps) {
  const [failed, setFailed] = useState(false);
  const box = `${SIZES[size]} shrink-0 rounded-ui`;

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`${box} grid place-items-center bg-panel-2 font-semibold text-muted`}
      >
        {name.slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={championIconUrl(name)}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${box} bg-panel-2 object-cover`}
    />
  );
}
