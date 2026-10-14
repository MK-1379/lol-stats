export function lpChange(values: number[]) {
  if (values.length < 2) return 0;
  return values[values.length - 1] - values[0];
}

export function formatLpChange(change: number) {
  if (change === 0) return "Sin cambios";
  return `${change > 0 ? "+" : "−"}${Math.abs(change)} LP`;
}

export function rollingAverage(values: number[], size: number) {
  return values.map((_, index) => {
    const window = values.slice(Math.max(0, index - size + 1), index + 1);
    const average = window.reduce((sum, value) => sum + value, 0) / window.length;
    return Math.round(average * 100) / 100;
  });
}

export function divisionBands(min: number, max: number) {
  const bands: { from: number; to: number }[] = [];
  for (let from = min; from < max; from += 100) {
    bands.push({ from, to: from + 100 });
  }
  return bands;
}
