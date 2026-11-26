import type { CSSProperties } from "react";
import { useMasteries } from "../hooks/useStats";
import { formatPoints } from "../utils/format";
import { ChampionBuildLink } from "./ChampionBuildLink";
import { ChampionIcon } from "./ChampionIcon";
import { MasteryEmblem } from "./MasteryEmblem";
import { Panel } from "./ui/Panel";
import { StateMessage } from "./ui/StateMessage";

export function MasteryCard() {
  const { data = [], isPending, isError, error } = useMasteries();

  return (
    <Panel title="Maestría">
      {isPending ? (
        <StateMessage kind="loading" message="Cargando maestrías…" />
      ) : isError ? (
        <StateMessage kind="error" message={`No se pudieron cargar: ${error.message}`} />
      ) : data.length === 0 ? (
        <StateMessage
          kind="empty"
          message="Todavía no hay maestrías. El worker las sincroniza cada 30 minutos."
        />
      ) : (
        <ol className="grid grid-cols-3 gap-2 p-panel">
          {data.map((mastery, index) => (
            <li
              key={mastery.championId}
              className="flex flex-col items-center gap-1.5 text-center motion-safe:animate-rise"
              style={{ "--stagger": `${index * 80}ms` } as CSSProperties}
            >
              <ChampionBuildLink champion={mastery.champion}>
                <ChampionIcon name={mastery.champion} size="lg" />
              </ChampionBuildLink>
              <MasteryEmblem level={mastery.level} />
              <p className="mt-1 w-full truncate font-semibold">{mastery.champion}</p>
              <p className="text-meta text-muted tabular-nums">{formatPoints(mastery.points)}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
