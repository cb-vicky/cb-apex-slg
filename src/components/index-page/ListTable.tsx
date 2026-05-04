import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  width?: string;
  className?: string;
  align?: "left" | "right" | "center";
  /** Decorative sort affordance (no sort behavior in prototype). */
  sortable?: boolean;
}

interface Props {
  columns: Column[];
  children: ReactNode;
  /** Shown in a slim toolbar above the header (e.g. filters). */
  toolbarLeft?: ReactNode;
  toolbarRight?: ReactNode;
  /** Renders as muted “N results” when set. */
  resultCount?: number;
  resultLabel?: string;
}

export function ListTable({ columns, children, toolbarLeft, toolbarRight, resultCount, resultLabel = "results" }: Props) {
  const showToolbar = toolbarLeft != null || toolbarRight != null || resultCount !== undefined;

  return (
    <div className="border-y border-border-default bg-white">
      {showToolbar && (
        <div className="flex min-h-[44px] items-center justify-between gap-3 border-b border-border-subtle bg-white py-2.5 pl-3 pr-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbarLeft}</div>
          <div className="flex shrink-0 items-center gap-2">
            {toolbarRight}
            {resultCount !== undefined && (
              <span className="text-[13px] tabular-nums text-text-muted">
                {resultCount} {resultLabel}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex min-h-[40px] shrink-0 items-center gap-3 border-b border-border-subtle bg-gray-50 py-2 pl-3 pr-4">
        {columns.map((col) => (
          <span
            key={col.key}
            className={cn(
              "flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold uppercase leading-none tracking-wider text-text-muted",
              col.align === "right" && "justify-end text-right",
              col.align === "center" && "justify-center text-center",
              col.className,
            )}
            style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { flex: 1 }}
          >
            <span className="truncate">{col.label}</span>
            {col.sortable && (
              <span className="inline-flex shrink-0 flex-col text-text-muted/50" aria-hidden>
                <ChevronUp size={9} strokeWidth={2} className="-mb-1" />
                <ChevronDown size={9} strokeWidth={2} className="-mt-1" />
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="divide-y divide-border-subtle">{children}</div>
    </div>
  );
}

export function ListRow({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 pl-3 pr-4 text-left text-[13px] leading-snug transition-colors hover:bg-surface-muted/60"
    >
      {children}
    </button>
  );
}

export function ListCell({
  children,
  className,
  width,
  align = "left",
  noTruncate,
}: {
  children: ReactNode;
  className?: string;
  width?: string;
  align?: "left" | "right" | "center";
  /** Set for badges, icon groups, or custom flex rows that must not clip. */
  noTruncate?: boolean;
}) {
  const inner = noTruncate ? (
    <span className="flex min-w-0 flex-1 items-center gap-2">{children}</span>
  ) : (
    <span className="block min-w-0 flex-1 truncate whitespace-nowrap">{children}</span>
  );

  return (
    <span
      className={cn(
        "flex min-h-[20px] min-w-0 items-center text-[13px] leading-snug",
        noTruncate && "min-w-0",
        align === "right" && "justify-end text-right tabular-nums",
        align === "center" && "justify-center text-center",
        className,
      )}
      style={width ? { width, minWidth: width, maxWidth: width } : { flex: 1 }}
    >
      {inner}
    </span>
  );
}
