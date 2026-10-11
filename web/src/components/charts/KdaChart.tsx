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
import { SegmentedControl } from "../ui/SegmentedControl";
import { ChartCard } from "./ChartCard";
import { axisTick, chartColors, tooltipBox } from "./chartTheme";

const METRICS = [
  { value: "kda", label: "KDA", description: "KDA" },
  { value: "csPerMinute", label: "CS/min", description: "Súbditos por minuto" },
  { value: "visionScore", label: "Visión", description: "Puntuación de visión" },
] as const;

type Metric = (typeof METRICS)[number]["value"];

export function KdaChart() {
  const [metric, setMetric] = useState<Metric>("kda");
  const { data = [], isPending, error } = useTrends(20);
  const metricInfo = METRICS.find((item) => item.value === metric)!;

  const points = data.map((match, index) => ({ ...match, game: index + 1 }));

  return (
    <ChartCard
      title="Tendencia"
      description={`${metricInfo.description} en las últimas ${points.length} partidas, de la más antigua a la más reciente`}
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
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={chartColors.grid} vertical={false} />
          <XAxis dataKey="game" tick={axisTick} stroke={chartColors.grid} />
          <YAxis tick={axisTick} stroke={chartColors.grid} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: chartColors.axis }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as (typeof points)[number];
              return (
                <div className={tooltipBox}>
                  <p className="text-meta text-muted">{formatDate(point.playedAt)}</p>
                  <p className="font-semibold text-ink">
                    {metricInfo.label} {point[metric]}
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
            dataKey={metric}
            stroke={chartColors.accent}
            strokeWidth={2}
            dot={{ r: 4, fill: chartColors.accent, stroke: chartColors.surface, strokeWidth: 2 }}
            activeDot={{
              r: 6,
              fill: chartColors.accent,
              stroke: chartColors.surface,
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
