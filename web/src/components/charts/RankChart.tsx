import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RankPoint } from "../../api/types";
import { useRankHistory } from "../../hooks/useStats";
import { formatDate, formatShortDate, formatTier, formatTotalLp } from "../../utils/format";
import { divisionBands, formatLpChange, lpChange } from "../../utils/trends";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ChartCard } from "./ChartCard";
import { axisTick, chartColors, tooltipBox } from "./chartTheme";

function lastSnapshotPerDay(points: RankPoint[]) {
  const byDay = new Map<string, RankPoint>();
  for (const point of points) {
    byDay.set(new Date(point.takenAt).toDateString(), point);
  }
  return [...byDay.values()];
}

function divisionTicks(values: number[]) {
  if (values.length === 0) {
    return { min: 0, max: 100, ticks: [0, 100] };
  }
  const min = Math.floor(Math.min(...values) / 100) * 100;
  const max = Math.max(Math.ceil(Math.max(...values) / 100) * 100, min + 100);
  const ticks: number[] = [];
  for (let value = min; value <= max; value += 100) {
    ticks.push(value);
  }
  return { min, max, ticks };
}

const PERIODS = [
  { value: 7, label: "7 d" },
  { value: 30, label: "30 d" },
  { value: 90, label: "90 d" },
];

export function RankChart() {
  const [days, setDays] = useState(30);
  const { data: snapshots = [], isPending, error } = useRankHistory(days);
  const data = lastSnapshotPerDay(snapshots);

  const values = data.map((point) => point.totalLp);
  const { min, max, ticks } = divisionTicks(values);
  const change = lpChange(values);
  const last = data[data.length - 1];

  return (
    <ChartCard
      title="Evolución del rango"
      description={`Tu rango al final de cada día, últimos ${days} días`}
      headline={
        last && (
          <p className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className={`font-display text-stat font-bold tabular-nums ${change > 0 ? "text-win" : change < 0 ? "text-loss" : "text-ink"}`}
            >
              {formatLpChange(change)}
            </span>
            <span className="text-small text-muted">
              en {days} días · ahora {formatTier(last.tier)} {last.rank}, {last.leaguePoints} LP
            </span>
          </p>
        )
      }
      controls={
        <SegmentedControl label="Periodo" options={PERIODS} value={days} onChange={setDays} />
      }
      isPending={isPending}
      error={error}
      isEmpty={data.length < 2}
      emptyMessage="Hacen falta datos de al menos dos días distintos para dibujar la evolución. Vuelve mañana."
      table={
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 pr-4 font-medium">
                Fecha
              </th>
              <th scope="col" className="py-1 font-medium">
                Rango
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.takenAt}>
                <td className="py-1 pr-4">{formatDate(point.takenAt)}</td>
                <td className="py-1">
                  {formatTier(point.tier)} {point.rank} · {point.leaguePoints} LP
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 24, bottom: 0, left: 8 }}>
          {divisionBands(min, max).map((band, index) => (
            <ReferenceArea
              key={band.from}
              y1={band.from}
              y2={band.to}
              fill={index % 2 === 0 ? chartColors.band : chartColors.surface}
              fillOpacity={1}
              stroke="none"
            />
          ))}
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis
            dataKey="takenAt"
            tickFormatter={formatShortDate}
            tick={axisTick}
            stroke={chartColors.grid}
            minTickGap={24}
          />
          <YAxis
            dataKey="totalLp"
            domain={[min, max]}
            ticks={ticks}
            tickFormatter={formatTotalLp}
            tick={axisTick}
            stroke={chartColors.grid}
            width={96}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: chartColors.axis }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as (typeof data)[number];
              return (
                <div className={tooltipBox}>
                  <p className="text-muted">{formatDate(point.takenAt)}</p>
                  <p className="font-semibold text-ink">
                    {formatTier(point.tier)} {point.rank} · {point.leaguePoints} LP
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="totalLp"
            stroke={chartColors.accent}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 6,
              fill: chartColors.accent,
              stroke: chartColors.surface,
              strokeWidth: 2,
            }}
          />
          {last && (
            <ReferenceDot
              x={last.takenAt}
              y={last.totalLp}
              r={5}
              fill={chartColors.accent}
              stroke={chartColors.surface}
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
