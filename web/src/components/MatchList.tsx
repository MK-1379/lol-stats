import { useState, type CSSProperties } from "react";
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
import { PositionIcon } from "./ui/PositionIcon";
import { ScoreBadge } from "./ui/ScoreBadge";
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
            className="focus-ring min-h-9 rounded-ui border border-control bg-panel-2 px-2 text-small font-semibold text-ink hover:border-muted"
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
            key={`${result}-${position}`}
            className="space-y-1.5 p-2"
            aria-label="Partidas, de la más reciente a la más antigua"
          >
            {shown.map((match, index) => (
              <MatchRow
                key={match.matchId}
                match={match}
                isBest={match.matchId === bestId}
                order={index % PAGE_SIZE}
              />
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

type MatchRowProps = {
  match: MatchItem;
  isBest: boolean;
  order: number;
};

function MatchRow({ match, isBest, order }: MatchRowProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const { score, parts } = performanceScore(match);
  const scoreInfo = scoreTone(score);
  const detailsId = `details-${match.matchId}`;
  const when = formatRelative(match.playedAt);
  const tone = match.win
    ? { row: "bg-win-bg before:bg-win", text: "text-win", label: "Victoria" }
    : { row: "bg-loss-bg before:bg-loss", text: "text-loss", label: "Derrota" };

  function toggle() {
    setOpen((current) => !current);
    setOpened(true);
  }

  return (
    <li
      style={{ "--stagger": `${order * 60}ms` } as CSSProperties}
      className={`relative overflow-hidden rounded-ui pl-1 before:absolute before:inset-y-0 before:left-0 before:w-1 before:origin-top before:content-[''] motion-safe:animate-rise motion-safe:before:animate-draw-bar ${tone.row}`}
    >
      <div className="relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-1.5 py-2 pr-2 pl-3 sm:grid-cols-[88px_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.9fr)_112px_32px] sm:gap-x-4 sm:py-2.5 sm:pr-1.5">
        <div className="col-start-1 row-start-2 flex min-w-0 items-baseline gap-2 sm:row-start-1 sm:block">
          <p className={`text-small font-bold ${tone.text}`}>{tone.label}</p>
          <p className="truncate text-meta text-muted">
            <time dateTime={match.playedAt} title={formatDate(match.playedAt)}>
              {when}
            </time>
            <span className="hidden tabular-nums sm:block">
              {formatDuration(match.durationSeconds)}
            </span>
          </p>
        </div>

        <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2.5 sm:col-start-2 sm:gap-3">
          <ChampionIcon name={match.champion} size="row" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{match.champion}</p>
            <p className="flex items-center gap-1 text-meta text-muted">
              <PositionIcon position={match.position} className="size-3.5" />
              <span aria-hidden="true">{formatPosition(match.position)}</span>
            </p>
          </div>
        </div>

        <div className="col-start-2 row-start-1 text-right sm:col-start-3 sm:text-left">
          <p className="text-heading font-semibold whitespace-nowrap tabular-nums">
            <span aria-hidden="true">
              {match.kills} <span className="text-faint">/</span> {match.deaths}{" "}
              <span className="text-faint">/</span> {match.assists}
            </span>
            <span className="sr-only">
              {match.kills} asesinatos, {match.deaths} muertes, {match.assists} asistencias
            </span>
          </p>
          <p className={`text-meta font-semibold tabular-nums ${kdaTone(match.kda)}`}>
            {match.kda}:1 KDA
          </p>
        </div>

        <div className="col-start-3 row-start-1 flex flex-col items-end sm:col-start-5">
          <span className="flex items-center gap-1.5">
            <ScoreBadge score={score} level={scoreInfo.level} className="size-5 sm:size-6" />
            <span
              className={`font-display text-heading font-bold tabular-nums sm:text-stat ${scoreInfo.text}`}
            >
              {score.toFixed(1)}
              <span aria-hidden="true" className="text-meta font-semibold text-muted sm:text-small">
                /10
              </span>
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-meta text-muted">
            {isBest && (
              <span
                title="Mejor puntuación de las partidas mostradas"
                className="rounded-ui bg-perf-4 px-1 text-caption font-bold text-bg uppercase"
              >
                Mejor
                <span className="sr-only"> puntuación de las partidas mostradas</span>
              </span>
            )}
            {scoreInfo.label}
            <span className="sr-only">. Puntuación sobre 10</span>
          </span>
        </div>

        <dl className="col-start-2 row-start-2 flex justify-end gap-3 text-meta sm:col-start-4 sm:row-start-1 sm:block sm:space-y-0.5">
          <div className="flex gap-1">
            <dt className="text-muted">CS</dt>
            <dd className="tabular-nums">
              {match.cs}
              <span className="hidden text-muted sm:inline">
                {" "}
                ({csPerMinute(match.cs, match.durationSeconds)}/min)
              </span>
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
          onClick={toggle}
          className="col-start-3 row-start-2 grid size-6 place-items-center justify-self-end rounded-ui text-muted transition-colors after:absolute after:inset-0 after:rounded-ui after:content-[''] hover:text-ink hover:after:bg-ink/5 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand sm:col-start-6 sm:row-start-1 sm:size-8"
        >
          <span className="sr-only">
            {open ? "Ocultar marcador" : "Ver marcador"}: {match.champion}, {tone.label}, {when}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`size-4 transition-transform duration-300 ease-out motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
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
      </div>

      <div
        id={detailsId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-350 ease-out motion-reduce:transition-none ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          {opened && (
            <div className="space-y-4 rounded-br-ui border-t border-line bg-panel p-3 [--stagger:0ms]">
              <Scoreboard matchId={match.matchId} durationSeconds={match.durationSeconds} />
              <div>
                <p className="caption">Cómo se calcula tu puntuación</p>
                <p className="mt-0.5 mb-2 text-meta text-muted">
                  Cada parte compara tu partida con un objetivo y aporta puntos a tu nota de 10.
                </p>
                <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-5">
                  {parts.map((part) => (
                    <li key={part.label} className="text-meta">
                      <div className="flex justify-between gap-2">
                        <span className="text-muted">
                          {part.label}{" "}
                          <span className="text-faint">· {Math.round(part.weight * 100)}%</span>
                        </span>
                        <span className="font-semibold tabular-nums">
                          +{(part.value * part.weight * 10).toFixed(1)}
                          <span className="sr-only"> puntos</span>
                        </span>
                      </div>
                      <div aria-hidden="true" className="mt-1 h-1 rounded-full bg-panel-2">
                        <div
                          className={`h-full origin-left rounded-full bg-perf-3 ${open ? "motion-safe:animate-grow-x" : ""}`}
                          style={{ width: `${part.value * 100}%` }}
                        />
                      </div>
                      <p className="mt-1 text-faint tabular-nums">
                        <span className="text-ink">{part.raw}</span>
                        {part.target && ` · objetivo ${part.target}`}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
