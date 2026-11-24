import type { CSSProperties } from "react";
import { ApiError } from "../api/client";
import type { CoachReport, CoachStrength, CoachTip, WeeklyGoal } from "../api/types";
import { useCoach } from "../hooks/useCoach";
import { formatCoachTarget, formatCoachValue } from "../utils/coach";
import { formatPosition } from "../utils/format";
import { CoachSummaryPanel } from "./CoachSummaryPanel";
import { Panel } from "./ui/Panel";
import { PositionIcon } from "./ui/PositionIcon";
import { StateMessage } from "./ui/StateMessage";

export function CoachPanel() {
  const { data, isPending, isError, error } = useCoach();

  if (isPending) {
    return (
      <Panel title="Consejos del coach">
        <StateMessage kind="loading" message="Analizando tus partidas…" />
      </Panel>
    );
  }

  if (isError) {
    const notEnoughGames = error instanceof ApiError && error.status === 404;
    return (
      <Panel title="Consejos del coach">
        <StateMessage
          kind={notEnoughGames ? "empty" : "error"}
          message={notEnoughGames ? error.message : `No se pudo cargar el coach: ${error.message}`}
        />
      </Panel>
    );
  }

  return <CoachBody report={data} />;
}

function CoachBody({ report }: { report: CoachReport }) {
  return (
    <div className="grid items-start gap-gap lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="grid gap-gap">
        <CoachSummaryPanel />
        <Panel
          title="Consejos del coach"
          aside={
            <p className="flex items-center gap-1.5 text-meta text-muted tabular-nums">
              <PositionIcon position={report.position} />
              {formatPosition(report.position)} · {report.gamesAnalyzed} partidas ·{" "}
              {report.winrate}% victorias
            </p>
          }
        >
          {report.tips.length === 0 ? (
            <StateMessage
              kind="empty"
              message="Cumples todos los objetivos en tu posición. Sigue así."
            />
          ) : (
            <ol aria-label="Consejos" className="divide-y divide-line">
              {report.tips.map((tip, index) => (
                <TipItem key={tip.metric} tip={tip} index={index} />
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-gap">
        <GoalPanel goal={report.weeklyGoal} />
        <StrengthsPanel strengths={report.strengths} />
      </div>
    </div>
  );
}

function TipItem({ tip, index }: { tip: CoachTip; index: number }) {
  return (
    <li
      className="flex gap-3 p-panel motion-safe:animate-rise"
      style={{ "--stagger": `${index * 80}ms` } as CSSProperties}
    >
      <span
        aria-hidden="true"
        className="grid size-7 shrink-0 place-items-center rounded-full bg-loss-bg font-display text-heading font-bold text-loss"
      >
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-semibold">{tip.label}</h3>
          <p className="text-small tabular-nums">
            <span className="font-semibold text-loss">{formatCoachValue(tip.metric, tip.value)}</span>{" "}
            <span className="text-muted">
              objetivo {formatCoachTarget(tip.metric, tip.direction, tip.target)}
            </span>
          </p>
        </div>
        <p className="mt-1 text-small text-muted">{tip.advice}</p>
        {tip.inWins !== null && tip.inLosses !== null && (
          <dl className="mt-3 grid max-w-sm grid-cols-2 gap-2 text-small">
            <div className="rounded-ui bg-win-bg px-3 py-1.5">
              <dt className="text-meta text-muted">En victorias</dt>
              <dd className="font-semibold text-win tabular-nums">
                {formatCoachValue(tip.metric, tip.inWins)}
              </dd>
            </div>
            <div className="rounded-ui bg-loss-bg px-3 py-1.5">
              <dt className="text-meta text-muted">En derrotas</dt>
              <dd className="font-semibold text-loss tabular-nums">
                {formatCoachValue(tip.metric, tip.inLosses)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </li>
  );
}

function GoalPanel({ goal }: { goal: WeeklyGoal | null }) {
  if (!goal) {
    return (
      <Panel title="Objetivo de la semana">
        <StateMessage kind="empty" message="Sin objetivo pendiente: ya cumples todos." />
      </Panel>
    );
  }

  const slots = Array.from({ length: goal.outOf }, (_, index) => index);

  return (
    <Panel title="Objetivo de la semana">
      <div className="p-panel">
        <p className="font-display text-name font-bold text-gold tabular-nums">
          {goal.label} {formatCoachTarget(goal.metric, goal.direction, goal.target)}
        </p>
        <p className="mt-1 text-small text-muted">
          en {goal.requiredHits} de tus próximas {goal.outOf} partidas
        </p>
        <div
          role="img"
          aria-label={`Ahora lo cumples en ${goal.currentHits} de ${goal.outOf}. Objetivo: ${goal.requiredHits}.`}
          className="mt-4 grid grid-cols-10 gap-1"
        >
          {slots.map((slot) => (
            <span
              key={slot}
              className={`h-2 rounded-full ${
                slot < goal.currentHits
                  ? "bg-brand"
                  : slot < goal.requiredHits
                    ? "border border-gold bg-transparent"
                    : "bg-panel-2"
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-meta text-muted tabular-nums">
          Ahora: {goal.currentHits} de {goal.outOf}
        </p>
      </div>
    </Panel>
  );
}

function StrengthsPanel({ strengths }: { strengths: CoachStrength[] }) {
  return (
    <Panel title="Puntos fuertes">
      {strengths.length === 0 ? (
        <StateMessage kind="empty" message="Todavía no cumples ningún objetivo." />
      ) : (
        <ul className="divide-y divide-line">
          {strengths.map((strength) => (
            <li key={strength.metric} className="flex items-baseline justify-between gap-3 px-panel py-2">
              <span className="text-small">{strength.label}</span>
              <span className="font-semibold text-win tabular-nums">
                {formatCoachValue(strength.metric, strength.value)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
