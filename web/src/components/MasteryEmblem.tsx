import { useId } from "react";
import { masteryColor } from "../utils/format";

export function MasteryEmblem({ level }: { level: number }) {
  const gradientId = useId();
  const color = masteryColor(level);

  return (
    <div role="img" aria-label={`Maestría nivel ${level}`} className="relative h-10 w-9 shrink-0">
      <svg viewBox="0 0 36 40" aria-hidden="true" className="size-full">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} />
            <stop offset="1" stopColor={`color-mix(in srgb, ${color} 40%, black)`} />
          </linearGradient>
        </defs>
        <path
          d="M18 1 31 6v11c0 9-5.5 15-13 19C10.5 32 5 26 5 17V6Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M18 6 27 9.5V17c0 6-3.5 10.5-9 13.5-5.5-3-9-7.5-9-13.5V9.5Z"
          fill="none"
          stroke="white"
          strokeOpacity="0.45"
          strokeWidth="1.5"
        />
      </svg>
      <span className="absolute inset-x-0 -bottom-1 mx-auto w-fit min-w-7 rounded-full border border-line bg-panel px-1.5 text-center text-caption font-bold tabular-nums">
        {level}
      </span>
    </div>
  );
}
