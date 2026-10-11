import { useRef, type KeyboardEvent } from "react";

type Tab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

type TabsProps<T extends string> = {
  label: string;
  tabs: Tab<T>[];
  selected: T;
  onSelect: (id: T) => void;
};

export function Tabs<T extends string>({ label, tabs, selected, onSelect }: TabsProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: KeyboardEvent, index: number) {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      Home: -index,
      End: tabs.length - 1 - index,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (index + moves[event.key] + tabs.length) % tabs.length;
    onSelect(tabs[next].id);
    buttons.current[next]?.focus();
  }

  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto">
      {tabs.map((tab, index) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`focus-ring -mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-base font-semibold transition-colors ${
              isSelected
                ? "border-brand text-ink"
                : "border-transparent text-muted hover:border-line hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="rounded-ui bg-panel-2 px-1.5 text-meta text-muted tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
