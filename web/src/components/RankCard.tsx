import type { Summary } from "../api/types";
import { useSummary } from "../hooks/useSummary";
import { formatShortDate, formatTier, nextDivision, winrateTone } from "../utils/format";
import { RankEmblem } from "./RankEmblem";
import { Panel } from "./ui/Panel";
import { StateMessage } from "./ui/StateMessage";

export function RankCard() {
  const { data, isPending, isError, error } = useSummary();

  return (
    <Panel title="Clasificatoria Solo/Dúo">
      {isPending ? (
        <StateMessage kind="loading" message="Cargando rango…" />
      ) : isError ? (
        <StateMessage kind="error" message={`No se pudo cargar el rango: ${error.message}`} />
      ) : !data.rank ? (
        <StateMessage kind="empty" message="Sin clasificar esta temporada." />
      ) : (
        <RankBody rank={data.rank} peak={data.peakRank} />
      )}
    </Panel>
  );
}

type Rank = NonNullable<Summary["rank"]>;
type Peak = Summary["peakRank"];

function RankBody({ rank, peak }: { rank: Rank; peak: Peak }) {
  const games = rank.wins + rank.losses;
  const winrate = games ? Math.round((rank.wins / games) * 1000) / 10 : 0;
  const next = nextDivision(rank.tier, rank.rank);

  return (
    <div className="p-panel">
      <div className="flex items-center gap-4">
        <RankEmblem tier={rank.tier} />
        <div className="min-w-0">
          <p className="font-display text-name font-bold whitespace-nowrap text-gold uppercase">
            {formatTier(rank.tier)} {rank.rank}
          </p>
          <p className="text-base font-semibold tabular-nums">{rank.leaguePoints} LP</p>
          <p className="mt-1 text-small text-muted tabular-nums">
            {rank.wins}V {rank.losses}D ·{" "}
            <span className={`font-semibold ${winrateTone(winrate)}`}>{winrate}%</span>
          </p>
          {peak && <PeakLine rank={rank} peak={peak} />}
        </div>
      </div>
      {next && (
        <div className="mt-4">
          <div
            role="progressbar"
            aria-label={`LP hacia ${next}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(rank.leaguePoints, 100)}
            className="h-1.5 rounded-full bg-panel-2"
          >
            <div
              className="shimmer h-full origin-left rounded-full bg-gold motion-safe:animate-grow-x"
              style={{ width: `${Math.min(rank.leaguePoints, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-meta text-muted">
            {100 - rank.leaguePoints} LP para {next}
          </p>
        </div>
      )}
    </div>
  );
}

function PeakLine({ rank, peak }: { rank: Rank; peak: NonNullable<Peak> }) {
  const isCurrentPeak =
    peak.tier === rank.tier && peak.rank === rank.rank && peak.leaguePoints === rank.leaguePoints;

  return (
    <p className="mt-1 text-small text-muted tabular-nums">
      Peak:{" "}
      <span className="font-semibold whitespace-nowrap text-gold">
        {formatTier(peak.tier)} {peak.rank} · {peak.leaguePoints} LP
      </span>{" "}
      <span className="whitespace-nowrap">
        {isCurrentPeak ? "(ahora mismo)" : `(${formatShortDate(peak.reachedAt)})`}
      </span>
    </p>
  );
}
