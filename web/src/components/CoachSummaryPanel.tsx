import { ApiError } from "../api/client";
import { useCoachSummary } from "../hooks/useCoachSummary";
import { Panel } from "./ui/Panel";
import { StateMessage } from "./ui/StateMessage";

export function CoachSummaryPanel() {
  const { data, isPending, isError, error } = useCoachSummary();

  if (isError && error instanceof ApiError && error.status === 503) {
    return null;
  }

  return (
    <Panel
      title="Resumen del coach"
      aside={<span className="rounded-ui bg-panel-2 px-2 py-0.5 text-meta text-muted">IA</span>}
    >
      {isPending ? (
        <StateMessage kind="loading" message="Escribiendo tu resumen…" />
      ) : isError ? (
        <StateMessage kind="empty" message={error.message} />
      ) : (
        <div className="space-y-2 p-panel motion-safe:animate-rise">
          {data.text
            .split(/\n+/)
            .filter((paragraph) => paragraph.trim())
            .map((paragraph) => (
              <p key={paragraph} className="text-base">
                {paragraph}
              </p>
            ))}
          <p className="pt-1 text-meta text-muted">
            Generado con {data.model} a partir de tus estadísticas. Se actualiza una vez al día.
          </p>
        </div>
      )}
    </Panel>
  );
}
