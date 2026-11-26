import type { ReactNode } from "react";
import { Link } from "react-router";
import { championBuildPath } from "../utils/format";

type ChampionBuildLinkProps = {
  champion: string;
  children: ReactNode;
};

export function ChampionBuildLink({ champion, children }: ChampionBuildLinkProps) {
  return (
    <Link
      to={championBuildPath(champion)}
      aria-label={`Ver build de ${champion}`}
      title={`Ver build de ${champion}`}
      className="focus-ring inline-flex shrink-0 rounded-ui transition-[transform,filter] duration-150 hover:brightness-110 motion-safe:hover:scale-105"
    >
      {children}
    </Link>
  );
}
