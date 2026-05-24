"use client";

import { cn } from "@/lib/utils";

export type PaperPanelVariant = "flat" | "sheet" | "inset";

type PaperPanelProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: PaperPanelVariant;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
};

export function PaperPanel({
  id,
  title,
  description,
  action,
  variant = "flat",
  className,
  bodyClassName,
  children,
}: PaperPanelProps) {
  const hasHeader = Boolean(title || description || action);

  return (
    <section
      id={id}
      className={cn(
        "paper-panel on-paper",
        variant === "sheet" && "paper-panel--tape tape-both",
        variant === "inset" && "paper-panel--inset",
        className,
      )}
    >
      {hasHeader && (
        <div className="paper-panel-header">
          <div className="min-w-0 space-y-0.5">
            {title ? <h2 className="paper-panel-title">{title}</h2> : null}
            {description ? (
              <p className="paper-panel-description">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      )}
      <div className={cn("paper-panel-body", bodyClassName)}>{children}</div>
    </section>
  );
}
