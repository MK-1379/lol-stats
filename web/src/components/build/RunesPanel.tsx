import type { BuildOption, GameEntry, RunePage } from "../../api/types";
import { Panel } from "../ui/Panel";
import { GameIcon } from "./GameIcon";
import { OptionStats } from "./OptionStats";

type RunesPanelProps = {
  options: BuildOption<RunePage>[];
};

export function RunesPanel({ options }: RunesPanelProps) {
  const [best, alternative] = options;
  if (!best) return null;

  const page = best.value;

  return (
    <Panel title="Runas" aside={<OptionStats games={best.games} winrate={best.winrate} />}>
      <div className="grid gap-5 p-panel sm:grid-cols-2">
        <RuneTree tree={page.primary} runes={page.perks.slice(0, 4)} highlightFirst />
        <div className="grid content-start gap-5">
          <RuneTree tree={page.secondary} runes={page.perks.slice(4)} />
          <div>
            <p className="caption mb-2">Fragmentos</p>
            <ul className="flex gap-2">
              {page.shards.map((shard, index) => (
                <li key={`${shard.id}-${index}`}>
                  <GameIcon entry={shard} size="sm" round />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {alternative && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-panel py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="caption">Alternativa</span>
            <GameIcon entry={alternative.value.perks[0]} size="md" round />
            <GameIcon entry={alternative.value.secondary} size="sm" round />
          </div>
          <OptionStats games={alternative.games} winrate={alternative.winrate} />
        </div>
      )}
    </Panel>
  );
}

type RuneTreeProps = {
  tree: GameEntry;
  runes: GameEntry[];
  highlightFirst?: boolean;
};

function RuneTree({ tree, runes, highlightFirst = false }: RuneTreeProps) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-2 font-semibold">
        <GameIcon entry={tree} size="sm" round />
        {tree.name}
      </p>
      <ul className="grid gap-2">
        {runes.map((rune, index) => {
          const isKeystone = highlightFirst && index === 0;
          return (
            <li key={rune.id} className="flex items-center gap-2.5">
              <GameIcon entry={rune} size={isKeystone ? "lg" : "md"} round />
              <span className={isKeystone ? "font-semibold" : "text-small text-muted"}>
                {rune.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
