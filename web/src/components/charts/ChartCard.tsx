import { useId, type ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description: string;
  headline?: ReactNode;
  controls?: ReactNode;
  isPending: boolean;
  error: Error | null;
  isEmpty: boolean;
  emptyMessage: string;
  table: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
};

export function ChartCard({
  title,
  description,
  headline,
  controls,
  isPending,
  error,
  isEmpty,
  emptyMessage,
  table,
  legend,
  children,
}: ChartCardProps) {
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className="panel flex flex-col">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-line px-panel py-2">
        <h2 id={titleId} className="text-heading font-semibold">
          {title}
        </h2>
        {controls}
      </div>

      <div className="flex-1 p-panel">
        {!isPending && !error && !isEmpty && headline}
        <p className="mb-3 text-small text-muted">{description}</p>
        {isPending ? (
          <div className="h-60 rounded-ui bg-panel-2 motion-safe:animate-pulse" role="status">
            <span className="sr-only">Cargando…</span>
          </div>
        ) : error ? (
          <p
            role="alert"
            className="grid h-60 place-items-center rounded-ui bg-panel-2 p-4 text-center text-loss"
          >
            No se pudieron cargar los datos: {error.message}
          </p>
        ) : isEmpty ? (
          <p className="grid h-60 place-items-center rounded-ui border border-dashed border-line p-4 text-center text-muted">
            {emptyMessage}
          </p>
        ) : (
          <>
            <div aria-hidden="true" className="h-60">
              {children}
            </div>
            {legend}
          </>
        )}
      </div>

      {!isPending && !error && !isEmpty && (
        <details className="group border-t border-line text-small">
          <summary className="focus-ring flex min-h-10 cursor-pointer list-none items-center gap-2 px-panel font-semibold text-muted hover:text-ink">
            <span
              aria-hidden="true"
              className="inline-block transition-transform group-open:rotate-90"
            >
              ›
            </span>
            Ver los datos en una tabla
          </summary>
          <div className="max-h-64 overflow-auto px-panel pb-3 tabular-nums">{table}</div>
        </details>
      )}
    </section>
  );
}
