import { useEffect, useState } from "react";
import { prefersReducedMotion } from "./useReducedMotion";

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    let frame = 0;
    let start: number | null = null;
    function tick(now: number) {
      start ??= now;
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return reduced ? target : value;
}
