import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";

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

type Indicator = {
  left: number;
  width: number;
};

export function Tabs<T extends string>({ label, tabs, selected, onSelect }: TabsProps<T>) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [animated, setAnimated] = useState(false);
  const selectedIndex = tabs.findIndex((tab) => tab.id === selected);

  useLayoutEffect(() => {
    const button = buttons.current[selectedIndex];
    if (!button) return;
    const target: HTMLButtonElement = button;
    function measure() {
      setIndicator({ left: target.offsetLeft, width: target.offsetWidth });
    }
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(button);
    return () => observer.disconnect();
  }, [selectedIndex]);

  useLayoutEffect(() => {
    if (!indicator || animated) return;
    const frame = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(frame);
  }, [indicator, animated]);

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
    <div
      role="tablist"
      aria-label={label}
      className="relative flex gap-1 overflow-x-auto overflow-y-hidden"
    >
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
            className={`focus-ring flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-base font-semibold transition-colors ${
              isSelected
                ? "border-transparent text-ink"
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
      {indicator && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 h-0.5 bg-brand ${animated ? "transition-[translate,width] duration-300 ease-out motion-reduce:transition-none" : ""}`}
          style={{ width: indicator.width, translate: `${indicator.left}px 0` }}
        />
      )}
    </div>
  );
}
