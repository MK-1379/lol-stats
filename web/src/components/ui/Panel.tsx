import { useId, type ReactNode } from "react";

type PanelProps = {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function Panel({ title, aside, children, className = "", bodyClassName = "" }: PanelProps) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className={`panel ${className}`}>
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2 border-b border-line px-panel py-2">
        <h2 id={titleId} className="text-heading font-semibold">
          {title}
        </h2>
        {aside}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}
