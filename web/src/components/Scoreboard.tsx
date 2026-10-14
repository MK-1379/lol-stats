import type { ScoreboardPlayer, ScoreboardTeam } from "../api/types";
import { useScoreboard } from "../hooks/useScoreboard";
import { csPerMinute, formatPosition, kdaTone, opggUrl } from "../utils/format";
import { performanceScore, scoreTone } from "../utils/score";
import { ChampionIcon } from "./ChampionIcon";
import { StateMessage } from "./ui/StateMessage";

type ScoreboardProps = {
  matchId: string;
  durationSeconds: number;
};

const numberFormat = new Intl.NumberFormat("es-ES", { useGrouping: "always" });
const compactFormat = new Intl.NumberFormat("es-ES", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function Scoreboard({ matchId, durationSeconds }: ScoreboardProps) {
  const { data, isPending, isError, error } = useScoreboard(matchId);

  if (isPending)
    return <StateMessage kind="loading" message="Cargando el marcador" className="px-0" />;
  if (isError) return <StateMessage kind="error" message={error.message} className="px-0" />;

  const players = data.teams.flatMap((team) => team.players);
  const scores = new Map(
    players.map((player) => [player, performanceScore({ ...player, durationSeconds }).score]),
  );
  const mvp = players.reduce((best, player) =>
    (scores.get(player) ?? 0) > (scores.get(best) ?? 0) ? player : best,
  );
  const maxDamage = Math.max(...players.map((player) => player.damageToChampions), 1);

  return (
    <div className="space-y-3">
      {data.teams.map((team) => (
        <TeamTable
          key={team.teamId}
          team={team}
          scores={scores}
          mvp={mvp}
          maxDamage={maxDamage}
          durationSeconds={durationSeconds}
        />
      ))}
    </div>
  );
}

type TeamTableProps = {
  team: ScoreboardTeam;
  scores: Map<ScoreboardPlayer, number>;
  mvp: ScoreboardPlayer;
  maxDamage: number;
  durationSeconds: number;
};

function TeamTable({ team, scores, mvp, maxDamage, durationSeconds }: TeamTableProps) {
  const tone = team.win ? "text-win" : "text-loss";

  return (
    <table className="w-full table-fixed border-collapse text-meta">
      <caption className="pb-1.5 text-left">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-small font-bold">
            <span className={tone}>{team.win ? "Victoria" : "Derrota"}</span>
            <span className="text-muted"> · {team.isMyTeam ? "Tu equipo" : "Equipo rival"}</span>
          </span>
          <span className="text-muted tabular-nums">
            {team.kills} asesinatos · {compactFormat.format(team.goldEarned)} de oro
          </span>
        </span>
      </caption>
      <thead>
        <tr className="border-b border-line text-left text-caption font-semibold text-faint uppercase">
          <th scope="col" className="py-1 pl-1.5 font-semibold">
            Jugador
          </th>
          <th scope="col" className="w-12 py-1 text-right font-semibold">
            Nota
          </th>
          <th scope="col" className="w-24 py-1 text-right font-semibold sm:w-28">
            KDA
          </th>
          <th scope="col" className="hidden w-28 py-1 pl-4 font-semibold sm:table-cell">
            Daño
          </th>
          <th scope="col" className="hidden w-20 py-1 text-right font-semibold md:table-cell">
            CS
          </th>
          <th scope="col" className="hidden w-14 py-1 text-right font-semibold md:table-cell">
            Visión
          </th>
        </tr>
      </thead>
      <tbody>
        {team.players.map((player) => (
          <PlayerRow
            key={`${player.gameName}#${player.tagLine}-${player.champion}`}
            player={player}
            score={scores.get(player) ?? 0}
            isMvp={player === mvp}
            maxDamage={maxDamage}
            durationSeconds={durationSeconds}
          />
        ))}
      </tbody>
    </table>
  );
}

type PlayerRowProps = {
  player: ScoreboardPlayer;
  score: number;
  isMvp: boolean;
  maxDamage: number;
  durationSeconds: number;
};

function PlayerRow({ player, score, isMvp, maxDamage, durationSeconds }: PlayerRowProps) {
  const scoreInfo = scoreTone(score);

  return (
    <tr
      className={`border-b border-line/60 last:border-b-0 ${player.isMe ? "bg-panel-2 shadow-[inset_3px_0_0_var(--brand)]" : ""}`}
    >
      <th scope="row" className="py-1.5 pr-2 pl-1.5 text-left font-normal">
        <span className="flex min-w-0 items-center gap-2">
          <span className="relative shrink-0">
            <ChampionIcon name={player.champion} size="sm" />
            <span
              aria-hidden="true"
              title="Nivel"
              className="absolute -right-1 -bottom-1 rounded-ui bg-ink px-0.5 text-caption leading-tight font-bold text-bg tabular-nums"
            >
              {player.champLevel}
            </span>
            <span className="sr-only">Nivel {player.champLevel}</span>
          </span>
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              {player.gameName ? (
                <a
                  href={opggUrl(player.gameName, player.tagLine)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Ver ${player.gameName}#${player.tagLine} en OP.GG`}
                  className={`focus-ring truncate rounded-ui hover:text-brand hover:underline ${player.isMe ? "font-bold text-ink" : "font-semibold"}`}
                >
                  {player.gameName}
                  <span className="sr-only"> (se abre OP.GG en una pestaña nueva)</span>
                </a>
              ) : (
                <span className="truncate font-semibold">Jugador</span>
              )}
              {player.isMe && (
                <span className="shrink-0 rounded-ui bg-brand px-1 text-caption font-bold text-bg uppercase">
                  Tú
                </span>
              )}
            </span>
            <span className="block truncate text-faint">
              {player.champion} · {formatPosition(player.position)}
            </span>
          </span>
        </span>
      </th>
      <td className="py-1.5 text-right">
        <span className={`block font-display text-base font-bold tabular-nums ${scoreInfo.text}`}>
          {score.toFixed(1)}
        </span>
        {isMvp && (
          <span className="rounded-ui bg-perf-4 px-1 text-caption font-bold text-bg uppercase">
            MVP
          </span>
        )}
      </td>
      <td className="py-1.5 text-right whitespace-nowrap tabular-nums">
        <span className="block font-semibold">
          <span aria-hidden="true">
            {player.kills}/{player.deaths}/{player.assists}
          </span>
          <span className="sr-only">
            {player.kills} asesinatos, {player.deaths} muertes, {player.assists} asistencias
          </span>
        </span>
        <span className={`block font-semibold ${kdaTone(player.kda)}`}>{player.kda}:1</span>
      </td>
      <td className="hidden py-1.5 pl-4 sm:table-cell">
        <span className="block tabular-nums">{numberFormat.format(player.damageToChampions)}</span>
        <span aria-hidden="true" className="mt-1 block h-1.5 rounded-full bg-panel-2">
          <span
            className={`block h-full rounded-full ${player.isMe ? "bg-brand" : "bg-faint"}`}
            style={{ width: `${(player.damageToChampions / maxDamage) * 100}%` }}
          />
        </span>
      </td>
      <td className="hidden py-1.5 text-right tabular-nums md:table-cell">
        <span className="block">{player.cs}</span>
        <span className="block text-faint">{csPerMinute(player.cs, durationSeconds)}/min</span>
      </td>
      <td className="hidden py-1.5 text-right tabular-nums md:table-cell">{player.visionScore}</td>
    </tr>
  );
}
