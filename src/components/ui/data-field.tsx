import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Label above value (reference: profile / ticket detail cards).
 * Use inside grids or `divide-y` stacks; values stay single-line via truncation.
 */
export function DataField({
  label,
  value,
  className,
  valueClassName,
  actions,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  /** e.g. tabular-nums for amounts */
  valueClassName?: string;
  actions?: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 py-2.5 text-left", className)}>
      <span className="text-[12px] leading-tight text-text-muted">{label}</span>
      <div className="flex min-w-0 items-center gap-1.5">
        <div
          className={cn(
            "min-w-0 flex-1 truncate text-[14px] font-medium leading-snug text-text-primary",
            valueClassName,
          )}
        >
          {value}
        </div>
        {actions ? <span className="shrink-0">{actions}</span> : null}
      </div>
    </div>
  );
}

/** Two-column grid of DataFields (common in SectionCard bodies). */
export function DataFieldGrid({ children, columns = 2 }: { children: ReactNode; columns?: 2 | 3 }) {
  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-0",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}
