import { cn } from "@/lib/utils";
import type { ReactNode, TdHTMLAttributes } from "react";
import { WTable, WThead, WTh, WTbody, WTd } from "@/components/ui/data-table";

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
  /** When set, the table body scrolls vertically while the header stays fixed. */
  scrollable?: boolean;
  maxBodyHeight?: string;
}

function parseColumnWidth(width?: string): number {
  if (!width) return 120;
  const n = Number.parseInt(width, 10);
  return Number.isFinite(n) ? n : 120;
}

function tableMinWidth(columns: Column[]): number {
  return columns.reduce((sum, col) => sum + parseColumnWidth(col.width), 48);
}

export function ListTable({ columns, children, scrollable, maxBodyHeight }: Props) {
  const minWidth = tableMinWidth(columns);

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div
        className={cn("overflow-x-auto", scrollable && "overflow-y-auto")}
        style={
          scrollable && maxBodyHeight
            ? { maxHeight: maxBodyHeight }
            : undefined
        }
      >
        <WTable style={{ minWidth }}>
          <WThead sticky={scrollable}>
            {columns.map((col) => (
              <WTh
                key={col.key}
                align={col.align}
                sortable={col.sortable}
                className={col.className}
                style={
                  col.width
                    ? { width: col.width, minWidth: col.width }
                    : undefined
                }
              >
                {col.label}
              </WTh>
            ))}
          </WThead>
          <WTbody>{children}</WTbody>
        </WTable>
      </div>
    </div>
  );
}

export function ListRow({
  onClick,
  children,
  className,
}: {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "cursor-pointer transition-colors hover:bg-surface-muted/70",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function ListCell({
  children,
  className,
  width,
  align = "left",
  truncate,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  width?: string;
  align?: "left" | "right" | "center";
  /** When true, clamp with ellipsis. Default false so wide columns scroll horizontally. */
  truncate?: boolean;
} & TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <WTd
      {...rest}
      align={align}
      truncate={truncate}
      className={className}
      style={width ? { width, minWidth: width } : undefined}
    >
      {children}
    </WTd>
  );
}
