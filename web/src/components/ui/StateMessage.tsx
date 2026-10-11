type StateMessageProps = {
  kind: "loading" | "empty" | "error";
  message: string;
  className?: string;
};

export function StateMessage({ kind, message, className = "" }: StateMessageProps) {
  if (kind === "loading") {
    return (
      <div role="status" className={`space-y-2 p-panel ${className}`}>
        <span className="sr-only">{message}</span>
        <div className="h-4 w-2/3 rounded-ui bg-panel-2 motion-safe:animate-pulse" />
        <div className="h-4 w-1/2 rounded-ui bg-panel-2 motion-safe:animate-pulse" />
        <div className="h-4 w-3/4 rounded-ui bg-panel-2 motion-safe:animate-pulse" />
      </div>
    );
  }

  return (
    <p
      role={kind === "error" ? "alert" : undefined}
      className={`p-panel text-small ${kind === "error" ? "text-loss" : "text-muted"} ${className}`}
    >
      {message}
    </p>
  );
}
