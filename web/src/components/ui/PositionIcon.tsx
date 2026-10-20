import { formatPosition } from "../../utils/format";

const SHAPES: Record<string, { main: string; faint?: string }> = {
  TOP: {
    main: "M3 3h14l-4 4H7v6l-4 4Z M10 10h4v4h-4Z",
    faint: "M21 7v14H7l4-4h6v-6Z",
  },
  JUNGLE: {
    main: "M7 2c3 3 4.5 7 4 11.5C10 11 8.5 9.5 6.5 8.5c1.5 3 2.5 6.5 2 10.5L12 22c3-5 5.5-11 5.5-17-2 2-3.5 4.5-4.5 7C12.5 8 10.5 4.5 7 2Z",
  },
  MIDDLE: {
    main: "M17 3h4v4L7 21H3v-4Z",
    faint: "M3 3h8l-8 8Z M21 21h-8l8-8Z",
  },
  BOTTOM: {
    main: "M21 21H7l4-4h6v-6l4-4Z M10 10h4v4h-4Z",
    faint: "M3 17V3h14l-4 4H7v6Z",
  },
  UTILITY: {
    main: "M9.5 3h5l-1 3.5h-3Z M2 7h7l3 3 3-3h7l-4.5 4H14l-1 11h-2L10 11H6.5Z",
  },
};

type PositionIconProps = {
  position: string;
  className?: string;
};

export function PositionIcon({ position, className = "size-4" }: PositionIconProps) {
  const shape = SHAPES[position];
  const name = formatPosition(position);

  if (!shape) return <span className="text-meta text-muted">{name}</span>;

  return (
    <svg role="img" aria-label={name} viewBox="0 0 24 24" className={`shrink-0 ${className}`}>
      <title>{name}</title>
      {shape.faint && <path d={shape.faint} fill="currentColor" opacity={0.35} />}
      <path d={shape.main} fill="currentColor" />
    </svg>
  );
}
