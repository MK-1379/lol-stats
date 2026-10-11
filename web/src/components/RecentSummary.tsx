import type { MatchItem } from "../api/types";
import { formatPosition, kdaTone } from "../utils/format";
import { performanceScore, scoreTone } from "../utils/score";
import { Panel } from "./ui/Panel";

const POSITIONS = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

export function RecentSummary({ matches }: { matches: MatchItem[] }) {
  const games = matches.length;
  const wins = matches.filter((match) => match.win).length;
  const winrate = Math.round((wins / games) * 100);
  const average = (pick: (match: MatchItem) => number) =>
    Math.round((matches.reduce((sum, match) => sum + pick(match), 0) / games) * 10) / 10;
  const kills = average((match) => match.kills);
  const deaths = average((match) => match.deaths);
  const assists = average((match) => match.assists);
  const kda = deaths === 0 ? kills + assists : Math.round(((kills + assists) / deaths) * 100) / 100;
  const averageScore = average((match) => performanceScore(match).score);
  const scoreInfo = scoreTone(averageScore);
  const roleCounts = POSITIONS.map((position) => ({
    position,
    count: matches.filter((match) => match.position === position).length,
  }));
  const maxRole = Math.max(...roleCounts.map((role) => role.count), 1);

  return (
    <Panel title={`Últimas ${games} partidas`}>
      <div className="grid gap-6 p-panel sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="flex items-center gap-4">
          <div className="relative grid size-16 shrink-0 place-items-center">
            <WinrateRing winrate={winrate} />
            <span className="absolute text-small font-bold tabular-nums">{winrate}%</span>
          </div>
          <div>
            <p className="text-small text-muted tabular-nums">
              {games}P {wins}V {games - wins}D
            </p>
            <p className="text-heading font-semibold">Winrate</p>
          </div>
        </div>

        <div className="sm:border-l sm:border-line sm:pl-6">
          <p className="text-heading font-semibold tabular-nums">
            {kills} / <span className="text-loss">{deaths}</span> / {assists}
          </p>
          <p className={`text-stat font-display font-bold tabular-nums ${kdaTone(kda)}`}>
            {kda}:1 <span className="text-small font-sans font-semibold text-muted">KDA medio</span>
          </p>
          <p className="mt-1 text-small text-muted">
            Puntuación media{" "}
            <span className={`font-semibold tabular-nums ${scoreInfo.text}`}>
              {averageScore.toFixed(1)}
            </span>
          </p>
        </div>

        <div className="sm:border-l sm:border-line sm:pl-6">
          <p className="caption mb-2">Posiciones</p>
          <ul className="flex items-end gap-3" aria-label="Partidas por posición">
            {roleCounts.map((role) => (
              <li key={role.position} className="flex flex-col items-center gap-1">
                <div aria-hidden="true" className="flex h-10 w-4 items-end rounded-sm bg-panel-2">
                  <div
                    className="w-full rounded-sm bg-brand"
                    style={{ height: `${(role.count / maxRole) * 100}%` }}
                  />
                </div>
                <span className="text-caption text-muted">{formatPosition(role.position)}</span>
                <span className="sr-only">{role.count} partidas</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Panel>
  );
}

function WinrateRing({ winrate }: { winrate: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const winLength = (winrate / 100) * circumference;

  return (
    <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden="true">
      <circle cx="32" cy="32" r={radius} fill="none" stroke="var(--loss)" strokeWidth="7" />
      <circle
        cx="32"
        cy="32"
        r={radius}
        fill="none"
        stroke="var(--win)"
        strokeWidth="7"
        strokeDasharray={`${winLength} ${circumference}`}
      />
    </svg>
  );
}
