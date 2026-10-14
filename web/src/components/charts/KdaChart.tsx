import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTrends } from "../../hooks/useStats";
import { formatDate } from "../../utils/format";
import { rollingAverage } from "../../utils/trends";
import { SegmentedControl } from "../ui/SegmentedControl";
import { ChartCard } from "./ChartCard";
import { axisTick, chartColors, tooltipBox } from "./chartTheme";

const METRICS = [
  { value: "kda", label: "KDA", description: "KDA", cap: 10 },
  { value: "csPerMinute", label: "CS/min", description: "Súbditos por minuto", cap: undefined },
  { value: "visionScore", label: "Visión", description: "Puntuación de visión", cap: undefined },
] as const;

type Metric = (typeof METRICS)[number]["value"];

const AVERAGE_SIZE = 5;

type TrendDotProps = {
  cx?: number;
  cy?: number;
  payload?: { win: boolean; clipped: boolean; real: number };
};

function TrendDot({ cx, cy, payload }: TrendDotProps) {
  if (cx === undefined || cy === undefined || !payload) return null;
  const color = payload.win ? chartColors.win : chartColors.loss;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={color} stroke={chartColors.surface} strokeWidth={2} />
      {payload.clipped && (
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={11} fill={chartColors.axis}>
          {payload.real}↑
        </text>
      )}
    </g>
  );
}

export function KdaChart() {
  const [metric, setMetric] = useState<Metric>("kda");
  const { data = [], isPending, error } = useTrends(20);
  const metricInfo = METRICS.find((item) => item.value === metric)!;

  const cap = metricInfo.cap;
  const averages = rollingAverage(
    data.map((match) => (cap ? Math.min(match[metric], cap) : match[metric])),
    AVERAGE_SIZE,
  );
  const points = data.map((match, index) => {
    const real = match[metric];
    return {
      ...match,
      game: index + 1,
      real,
      plotted: cap ? Math.min(real, cap) : real,
      clipped: cap !== undefined && real > cap,
      average: averages[index],
    };
  });

  return (
    <ChartCard
      title="Tendencia"
      description={`${metricInfo.description} en las últimas ${points.length} partidas, de la más antigua a la más reciente${cap ? `. Los valores por encima de ${cap} se dibujan arriba con una flecha` : ""}`}
      legend={
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-meta text-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-win" />
            Victoria
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 rounded-full bg-loss" />
            Derrota
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-0.5 w-4 rounded-full bg-ink/70" />
            Media de las últimas {AVERAGE_SIZE}
          </li>
        </ul>
      }
      controls={
        <SegmentedControl
          label="Métrica"
          options={METRICS.map(({ value, label }) => ({ value, label }))}
          value={metric}
          onChange={setMetric}
        />
      }
      isPending={isPending}
      error={error}
      isEmpty={points.length === 0}
      emptyMessage="Todavía no hay partidas guardadas."
      table={
        <table className="w-full text-left">
          <thead className="text-muted">
            <tr>
              <th scope="col" className="py-1 pr-4 font-medium">
                Partida
              </th>
              <th scope="col" className="py-1 pr-4 font-medium">
                Fecha
              </th>
              <th scope="col" className="py-1 pr-4 font-medium">
                Resultado
              </th>
              <th scope="col" className="py-1 pr-4 font-medium">
                KDA
              </th>
              <th scope="col" className="py-1 pr-4 font-medium">
                CS/min
              </th>
              <th scope="col" className="py-1 font-medium">
                Visión
              </th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.matchId}>
                <td className="py-1 pr-4">{point.game}</td>
                <td className="py-1 pr-4">{formatDate(point.playedAt)}</td>
                <td className="py-1 pr-4">{point.win ? "Victoria" : "Derrota"}</td>
                <td className="py-1 pr-4">{point.kda}</td>
                <td className="py-1 pr-4">{point.csPerMinute}</td>
                <td className="py-1">{point.visionScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart accessibilityLayer={false} data={points} margin={{ top: 20, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis dataKey="game" tick={axisTick} stroke={chartColors.grid} />
          <YAxis
            tick={axisTick}
            stroke={chartColors.grid}
            allowDecimals={false}
            domain={cap ? [0, cap] : [0, "auto"]}
            ticks={cap ? [0, 2, 4, 6, 8, 10] : undefined}
          />
          <Tooltip
            cursor={{ stroke: chartColors.axis }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as (typeof points)[number];
              return (
                <div className={tooltipBox}>
                  <p className="text-meta text-muted">{formatDate(point.playedAt)}</p>
                  <p className="font-semibold text-ink">
                    {metricInfo.label} {point.real}
                  </p>
                  <p className="text-meta text-muted">
                    Media de las últimas {AVERAGE_SIZE}: {point.average}
                  </p>
                  <p className={point.win ? "text-win" : "text-loss"}>
                    {point.win ? "Victoria" : "Derrota"}
                  </p>
                </div>
              );
            }}
          />
          <Line
            type="linear"
            dataKey="plotted"
            stroke={chartColors.grid}
            strokeWidth={1.5}
            dot={<TrendDot />}
            activeDot={{
              r: 6,
              fill: chartColors.accent,
              stroke: chartColors.surface,
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="average"
            stroke={chartColors.average}
            strokeOpacity={0.7}
            strokeWidth={2}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
