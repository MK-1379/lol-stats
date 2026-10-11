import { useChampionStats } from "../hooks/useStats";
import { kdaTone, winrateTone } from "../utils/format";
import { ChampionIcon } from "./ChampionIcon";
import { Panel } from "./ui/Panel";
import { StateMessage } from "./ui/StateMessage";

const VISIBLE = 7;

export function ChampionsMini({ onShowAll }: { onShowAll: () => void }) {
  const { data = [], isPending, isError, error } = useChampionStats();

  return (
    <Panel title="Campeones más jugados">
      {isPending ? (
        <StateMessage kind="loading" message="Cargando campeones…" />
      ) : isError ? (
        <StateMessage kind="error" message={`No se pudieron cargar: ${error.message}`} />
      ) : data.length === 0 ? (
        <StateMessage kind="empty" message="Todavía no hay partidas guardadas." />
      ) : (
        <>
          <ul className="divide-y divide-line">
            {data.slice(0, VISIBLE).map((champion) => (
              <li key={champion.championId} className="flex items-center gap-3 px-panel py-2">
                <ChampionIcon name={champion.champion} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{champion.champion}</p>
                  <p className={`text-meta font-semibold tabular-nums ${kdaTone(champion.kda)}`}>
                    {champion.kda} KDA
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold tabular-nums ${winrateTone(champion.winrate)}`}>
                    {champion.winrate}%
                  </p>
                  <p className="text-meta text-muted tabular-nums">
                    {champion.games} {champion.games === 1 ? "partida" : "partidas"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {data.length > VISIBLE && (
            <div className="border-t border-line p-2">
              <button
                type="button"
                onClick={onShowAll}
                className="focus-ring w-full rounded-ui py-2 text-small font-semibold text-muted transition-colors hover:bg-panel-2 hover:text-ink"
              >
                Ver los {data.length} campeones
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
