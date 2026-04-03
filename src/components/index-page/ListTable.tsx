import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  width?: string;
  className?: string;
}

interface Props {
  columns: Column[];
  children: ReactNode;
}

export function ListTable({ columns, children }: Props) {
  return (
    <div className="rounded-lg border border-border-default bg-white">
      <div className="flex items-center gap-4 border-b border-border-subtle bg-surface-muted px-4 py-2">
        {columns.map((col) => (
          <span
            key={col.key}
            className={cn("text-[11px] font-semibold uppercase tracking-wider text-text-muted truncate", col.className)}
            style={col.width ? { width: col.width, minWidth: col.width, maxWidth: col.width } : { flex: 1 }}
          >
            {col.label}
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
      onClick={onClick}
      className="flex w-full items-center gap-4 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-surface-muted"
    >
      {children}
    </button>
  );
}

export function ListCell({ children, className, width }: { children: ReactNode; className?: string; width?: string }) {
  return (
    <span
      className={cn("truncate text-[13px]", className)}
      style={width ? { width, minWidth: width, maxWidth: width } : { flex: 1 }}
    >
      {children}
    </span>
  );
}
