type Option<T extends string | number> = {
  value: T;
  label: string;
  count?: number;
};

type SegmentedControlProps<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-ui border border-line bg-panel-2 p-0.5"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-[3px] px-3 text-small font-semibold transition-colors active:translate-y-px ${
              isActive
                ? "bg-panel text-ink shadow-[0_0_0_1px_var(--line)]"
                : "text-muted hover:text-ink"
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="text-meta text-faint tabular-nums">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
