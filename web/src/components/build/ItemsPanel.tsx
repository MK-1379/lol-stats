import { Fragment, type ReactNode } from "react";
import type { BuildOption, ChampionBuild, GameEntry } from "../../api/types";
import { groupRepeated } from "../../utils/build";
import { Panel } from "../ui/Panel";
import { GameIcon } from "./GameIcon";
import { OptionStats } from "./OptionStats";

type ItemsPanelProps = {
  build: ChampionBuild;
};

export function ItemsPanel({ build }: ItemsPanelProps) {
  return (
    <Panel title="Objetos" bodyClassName="divide-y divide-line">
      <ItemSection title="Iniciales" options={build.startItems} render={(items) => <ItemGroup items={items} />} />
      <ItemSection title="Build principal" options={build.coreItems} render={(items) => <ItemPath items={items} />} />
      <ItemSection title="Botas" options={build.boots} render={(boots) => <GameIcon entry={boots} />} />
      {build.lateItems.length > 0 && (
        <section className="px-panel py-3">
          <h3 className="caption mb-2">Después de la build principal</h3>
          <ul className="flex flex-wrap gap-3">
            {build.lateItems.map((option) => (
              <li key={option.value.id} className="flex items-center gap-2">
                <GameIcon entry={option.value} />
                <OptionStats games={option.games} winrate={option.winrate} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </Panel>
  );
}

type ItemSectionProps<T> = {
  title: string;
  options: BuildOption<T>[];
  render: (value: T) => ReactNode;
};

function ItemSection<T>({ title, options, render }: ItemSectionProps<T>) {
  return (
    <section className="px-panel py-3">
      <h3 className="caption mb-2">{title}</h3>
      {options.length === 0 ? (
        <p className="text-small text-muted">Sin datos suficientes todavía.</p>
      ) : (
        <ul className="grid gap-2">
          {options.map((option, index) => (
            <li key={index} className="flex items-center justify-between gap-3">
              {render(option.value)}
              <OptionStats games={option.games} winrate={option.winrate} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemGroup({ items }: { items: GameEntry[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {groupRepeated(items).map(({ entry, count }) => (
        <span key={entry.id} className="relative">
          <GameIcon entry={entry} />
          {count > 1 && (
            <span className="absolute -right-1 -bottom-1 rounded-ui bg-ink px-1 text-caption leading-tight font-bold text-bg tabular-nums">
              {count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function ItemPath({ items }: { items: GameEntry[] }) {
  return (
    <ol className="flex items-center gap-1.5">
      {items.map((item, index) => (
        <Fragment key={item.id}>
          {index > 0 && (
            <span aria-hidden="true" className="text-faint">
              ›
            </span>
          )}
          <li>
            <GameIcon entry={item} size="lg" />
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
