import { useState } from "react";
import type { ChampionStat } from "../api/types";
import { useChampionStats } from "../hooks/useStats";
import { kdaTone, winrateTone } from "../utils/format";
import { ChampionIcon } from "./ChampionIcon";
import { Panel } from "./ui/Panel";
import { StateMessage } from "./ui/StateMessage";

type SortKey = "games" | "winrate" | "kda";

export function ChampionPool() {
  const { data = [], isPending, isError, error } = useChampionStats();
  const [sortKey, setSortKey] = useState<SortKey>("games");
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const sorted = [...data]
    .filter((champion) => champion.champion.toLowerCase().includes(normalizedQuery))
    .sort((a, b) => b[sortKey] - a[sortKey] || b.games - a.games);

  return (
    <Panel
      title="Estadísticas por campeón"
      aside={
        <div>
          <label htmlFor="champion-search" className="sr-only">
            Buscar campeón
          </label>
          <input
            id="champion-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar campeón"
            className="focus-ring min-h-9 w-48 rounded-ui border border-control bg-panel-2 px-3 text-small placeholder:text-faint hover:border-muted"
          />
        </div>
      }
    >
      {isPending ? (
        <StateMessage kind="loading" message="Cargando campeones…" />
      ) : isError ? (
        <StateMessage
          kind="error"
          message={`No se pudieron cargar los campeones: ${error.message}`}
        />
      ) : data.length === 0 ? (
        <StateMessage kind="empty" message="Todavía no hay partidas guardadas." />
      ) : sorted.length === 0 ? (
        <StateMessage kind="empty" message={`Ningún campeón coincide con «${query.trim()}».`} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <caption className="sr-only">
              Partidas, victorias, winrate y KDA por campeón. Pulsa una cabecera para ordenar.
            </caption>
            <thead className="bg-panel-2">
              <tr>
                <th scope="col" className="caption hidden w-10 py-2 pl-panel font-semibold sm:table-cell">
                  #
                </th>
                <th scope="col" className="caption w-full py-2 pl-3 font-semibold sm:pl-2">
                  Campeón
                </th>
                <SortableHeader
                  label="Partidas"
                  column="games"
                  sortKey={sortKey}
                  onSort={setSortKey}
                />
                <th
                  scope="col"
                  className="caption hidden px-3 py-2 text-right font-semibold sm:table-cell"
                >
                  V / D
                </th>
                <SortableHeader
                  label="Winrate"
                  column="winrate"
                  sortKey={sortKey}
                  onSort={setSortKey}
                />
                <SortableHeader label="KDA" column="kda" sortKey={sortKey} onSort={setSortKey} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((champion, index) => (
                <ChampionRow key={champion.championId} champion={champion} position={index + 1} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

type SortableHeaderProps = {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  onSort: (column: SortKey) => void;
};

function SortableHeader({ label, column, sortKey, onSort }: SortableHeaderProps) {
  const isActive = column === sortKey;
  return (
    <th
      scope="col"
      aria-sort={isActive ? "descending" : "none"}
      className="py-0.5 pr-2 pl-1 text-right whitespace-nowrap sm:pr-panel sm:pl-3"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className={`focus-ring caption inline-flex min-h-9 items-center gap-1 rounded-ui px-1 font-semibold transition-colors hover:text-ink ${
          isActive ? "text-ink" : ""
        }`}
      >
        {label}
        <span aria-hidden="true" className={isActive ? "text-brand" : "opacity-30"}>
          ▼
        </span>
      </button>
    </th>
  );
}

function ChampionRow({ champion, position }: { champion: ChampionStat; position: number }) {
  const losses = champion.games - champion.wins;
  return (
    <tr className="transition-colors hover:bg-panel-2">
      <td className="hidden py-2 pl-panel text-meta text-faint tabular-nums sm:table-cell">
        {position}
      </td>
      <td className="py-2 pl-3 sm:pl-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <ChampionIcon name={champion.champion} size="sm" />
          <span className="font-semibold whitespace-nowrap">{champion.champion}</span>
        </div>
      </td>
      <td className="py-2 pr-2 pl-1 text-right tabular-nums sm:pr-panel sm:pl-3">
        {champion.games}
      </td>
      <td className="hidden px-3 py-2 sm:table-cell">
        <div className="ml-auto flex w-28 items-center gap-2">
          <div
            aria-hidden="true"
            className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-loss"
          >
            <div className="bg-win" style={{ width: `${champion.winrate}%` }} />
          </div>
          <span className="text-meta text-muted whitespace-nowrap tabular-nums">
            {champion.wins}/{losses}
          </span>
        </div>
      </td>
      <td
        className={`py-2 pr-2 pl-1 text-right font-semibold tabular-nums sm:pr-panel sm:pl-3 ${winrateTone(champion.winrate)}`}
      >
        {champion.winrate}%
      </td>
      <td
        className={`py-2 pr-3 pl-1 text-right font-semibold tabular-nums sm:pr-panel sm:pl-3 ${kdaTone(champion.kda)}`}
      >
        {champion.kda}
      </td>
    </tr>
  );
}
