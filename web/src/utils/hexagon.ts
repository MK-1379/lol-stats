type Point = [number, number];

export const HEXAGON: Point[] = [
  [16, 2],
  [28, 9],
  [28, 23],
  [16, 30],
  [4, 23],
  [4, 9],
];

const TOP = 2;
const BOTTOM = 30;

export function hexagonPoints(points: Point[] = HEXAGON) {
  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

export function hexagonFill(fraction: number): Point[] {
  const level = Math.min(Math.max(fraction, 0), 1);
  if (level === 0) return [];
  const cut = BOTTOM - (BOTTOM - TOP) * level;
  const result: Point[] = [];

  HEXAGON.forEach((current, index) => {
    const next = HEXAGON[(index + 1) % HEXAGON.length];
    const currentInside = current[1] >= cut;
    const nextInside = next[1] >= cut;
    if (currentInside) result.push(current);
    if (currentInside !== nextInside) {
      const t = (cut - current[1]) / (next[1] - current[1]);
      result.push([current[0] + (next[0] - current[0]) * t, cut]);
    }
  });

  return result;
}
