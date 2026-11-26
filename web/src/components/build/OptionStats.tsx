import { winrateTone } from "../../utils/format";

type OptionStatsProps = {
  games: number;
  winrate: number;
};

export function OptionStats({ games, winrate }: OptionStatsProps) {
  return (
    <p className="shrink-0 text-right text-meta text-muted tabular-nums">
      <span className={`block text-small font-semibold ${winrateTone(winrate)}`}>{winrate}%</span>
      {games} {games === 1 ? "partida" : "partidas"}
    </p>
  );
}
