import { useState } from "react";
import type { MatchItem } from "../api/types";
import {
  csPerMinute,
  formatDate,
  formatDuration,
  formatPosition,
  formatRelative,
  kdaTone,
} from "../utils/format";
import { performanceScore, scoreTone } from "../utils/score";
import { ChampionIcon } from "./ChampionIcon";
import { Scoreboard } from "./Scoreboard";
import { Panel } from "./ui/Panel";
import { SegmentedControl } from "./ui/SegmentedControl";

type ResultFilter = "all" | "win" | "loss";

const PAGE_SIZE = 10;
const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export function MatchList({ matches }: { matches: MatchItem[] }) {
  const [result, setResult] = useState<ResultFilter>("all");
  const [position, setPosition] = useState("ALL");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const byPosition = matches.filter((match) => position === "ALL" || match.position === position);
  const filtered = byPosition.filter(
    (match) => result === "all" || match.win === (result === "win"),
  );
  const shown = filtered.slice(0, visible);
  const bestId = shown.reduce<MatchItem | null>(
    (best, match) =>
      !best || performanceScore(match).score > performanceScore(best).score ? match : best,
    null,
  )?.matchId;
  const wins = byPosition.filter((match) => match.win).length;

  function changeResult(next: ResultFilter) {
    setResult(next);
    setVisible(PAGE_SIZE);
  }

  function changePosition(next: string) {
    setPosition(next);
    setVisible(PAGE_SIZE);
  }

  return (
    <Panel
      title="Historial"
      aside={
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            label="Resultado"
            value={result}
            onChange={changeResult}
            options={[
              { value: "all", label: "Todas", count: byPosition.length },
              { value: "win", label: "Victorias", count: wins },
              { value: "loss", label: "Derrotas", count: byPosition.length - wins },
            ]}
          />
          <label className="sr-only" htmlFor="position-filter">
            Posición
          </label>
          <select
            id="position-filter"
            value={position}
            onChange={(event) => changePosition(event.target.value)}
            className="focus-ring min-h-9 rounded-ui border border-line bg-panel-2 px-2 text-small font-semibold text-ink hover:border-faint"
          >
            <option value="ALL">Todas las posiciones</option>
            {POSITIONS.map((item) => (
              <option key={item} value={item}>
                {formatPosition(item)}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-panel">
          <p className="text-small text-muted">No hay partidas con estos filtros.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              changeResult("all");
              changePosition("ALL");
            }}
          >
            Quitar filtros
          </button>
        </div>
      ) : (
        <>
          <ol
            className="space-y-1.5 p-2"
            aria-label="Partidas, de la más reciente a la más antigua"
          >
            {shown.map((match) => (
              <MatchRow key={match.matchId} match={match} isBest={match.matchId === bestId} />
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-panel py-2">
            <p className="text-meta text-muted tabular-nums">
              Mostrando {shown.length} de {filtered.length}
            </p>
            <button
              type="button"
              className="btn"
              disabled={shown.length >= filtered.length}
              onClick={() => setVisible((current) => current + PAGE_SIZE)}
            >
              Mostrar más
            </button>
          </div>
        </>
      )}
    </Panel>
  );
}

function MatchRow({ match, isBest }: { match: MatchItem; isBest: boolean }) {
  const [open, setOpen] = useState(false);
  const { score, parts } = performanceScore(match);
  const scoreInfo = scoreTone(score);
  const detailsId = `details-${match.matchId}`;
  const tone = match.win
    ? { row: "border-win bg-win-bg", text: "text-win", label: "Victoria" }
    : { row: "border-loss bg-loss-bg", text: "text-loss", label: "Derrota" };

  return (
    <li
      className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 rounded-ui border-l-4 py-2.5 pl-3 pr-3 sm:grid-cols-[88px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_72px_32px] sm:items-center sm:pr-1.5 ${tone.row}`}
    >
      <div className="flex items-baseline gap-2 sm:block">
        <p className={`text-small font-bold ${tone.text}`}>{tone.label}</p>
        <p className="text-meta text-muted">
          <time dateTime={match.playedAt} title={formatDate(match.playedAt)}>
            {formatRelative(match.playedAt)}
          </time>
        </p>
        <p className="text-meta text-muted tabular-nums">{formatDuration(match.durationSeconds)}</p>
      </div>

      <div className="col-start-2 row-start-1 flex flex-row-reverse items-baseline gap-2 self-start text-right sm:col-start-5 sm:flex-col sm:items-end sm:gap-0 sm:self-center">
        <span className="flex items-center gap-1.5">
          {isBest && (
            <span
              title="Mejor puntuación de las partidas mostradas"
              className="rounded-ui bg-kda-high px-1 text-caption font-bold text-bg uppercase"
            >
              Mejor
            </span>
          )}
          <span className={`font-display text-stat font-bold tabular-nums ${scoreInfo.text}`}>
            {score.toFixed(1)}
          </span>
        </span>
        <span className="text-meta text-muted">
          {scoreInfo.label}
          <span className="sr-only">. Puntuación sobre 10</span>
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <ChampionIcon name={match.champion} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{match.champion}</p>
          <p className="text-meta text-muted">{formatPosition(match.position)}</p>
        </div>
      </div>

      <div className="text-right sm:text-left">
        <p className="text-heading font-semibold whitespace-nowrap tabular-nums">
          {match.kills} <span className="text-faint">/</span>{" "}
          <span className="text-loss">{match.deaths}</span> <span className="text-faint">/</span>{" "}
          {match.assists}
        </p>
        <p className={`text-meta font-semibold tabular-nums ${kdaTone(match.kda)}`}>
          {match.kda}:1 KDA
        </p>
      </div>

      <dl className="col-span-2 flex gap-4 text-meta sm:col-span-1 sm:block sm:space-y-0.5">
        <div className="flex gap-1">
          <dt className="text-muted">CS</dt>
          <dd className="tabular-nums">
            {match.cs}{" "}
            <span className="text-muted">({csPerMinute(match.cs, match.durationSeconds)}/min)</span>
          </dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-muted">Visión</dt>
          <dd className="tabular-nums">{match.visionScore}</dd>
        </div>
      </dl>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={detailsId}
        onClick={() => setOpen((current) => !current)}
        className="focus-ring col-span-2 flex min-h-9 items-center justify-center gap-1.5 rounded-ui border border-line/70 text-meta font-semibold text-muted transition-colors hover:bg-panel/60 hover:text-ink active:translate-y-px sm:col-span-1 sm:col-start-6 sm:row-start-1 sm:h-full sm:border-0"
      >
        <span className="sm:sr-only">{open ? "Ocultar marcador" : "Ver marcador"}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M5 7.5 10 12.5 15 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          id={detailsId}
          className="col-span-full -mx-3 -mb-2.5 space-y-4 rounded-br-ui border-t border-line bg-panel p-3 sm:-mr-1.5"
        >
          <Scoreboard matchId={match.matchId} durationSeconds={match.durationSeconds} />
          <div>
            <p className="caption mb-2">Cómo se calcula tu puntuación</p>
            <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-5">
              {parts.map((part) => (
                <li key={part.label} className="text-meta">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">
                      {part.label}{" "}
                      <span className="text-faint">· {Math.round(part.weight * 100)}%</span>
                    </span>
                    <span className="font-semibold tabular-nums">
                      {Math.round(part.value * 100)}
                    </span>
                  </div>
                  <div aria-hidden="true" className="mt-1 h-1 rounded-full bg-panel-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${part.value * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </li>
  );
}
