import type { BuildOption, GameEntry } from "../../api/types";
import { Panel } from "../ui/Panel";
import { GameIcon } from "./GameIcon";
import { OptionStats } from "./OptionStats";

type SpellsPanelProps = {
  options: BuildOption<GameEntry[]>[];
};

export function SpellsPanel({ options }: SpellsPanelProps) {
  if (options.length === 0) return null;

  return (
    <Panel title="Hechizos">
      <ul className="grid gap-2 p-panel">
        {options.map((option) => (
          <li
            key={option.value.map((spell) => spell.id).join("-")}
            className="flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-1.5">
              {option.value.map((spell) => (
                <GameIcon key={spell.id} entry={spell} />
              ))}
              <span className="ml-1.5 text-small text-muted">
                {option.value.map((spell) => spell.name).join(" + ")}
              </span>
            </div>
            <OptionStats games={option.games} winrate={option.winrate} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
