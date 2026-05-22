import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes, TableHTMLAttributes, HTMLAttributes } from "react";

/** Shared table shell for workspace tabular data — zebra rows, single-line cells, calm enterprise header. */
export function WorkspaceTableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-y border-border-default bg-white", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function WTable({
  children,
  className,
  style,
  ...rest
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...rest}
      className={cn("w-full min-w-[640px] text-[13px]", className)}
      style={style}
    >
      {children}
    </table>
  );
}

export function WThead({
  children,
  className,
  sticky,
}: {
  children: ReactNode;
  className?: string;
  /** Keep header visible inside a vertically scrolling table container. */
  sticky?: boolean;
}) {
  return (
    <thead>
      <tr
        className={cn(
          "border-b border-border-subtle bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
          sticky && "sticky top-0 z-[1]",
          className,
        )}
      >
        {children}
      </tr>
    </thead>
  );
}

export function WTh({
  children,
  align = "left",
  sortable,
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  sortable?: boolean;
}) {
  return (
    <th
      {...rest}
      className={cn(
        "px-3 py-2.5 font-semibold whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sortable && (
          <span className="inline-flex flex-col text-text-muted/60" aria-hidden>
            <ChevronUp size={9} strokeWidth={2} className="-mb-1" />
            <ChevronDown size={9} strokeWidth={2} className="-mt-1" />
          </span>
        )}
      </span>
    </th>
  );
}

export function WTbody({ children, striped = false }: { children: ReactNode; striped?: boolean }) {
  return (
    <tbody
      className={cn("divide-y divide-border-subtle", striped && "[&>tr:nth-child(even)]:bg-gray-50/60")}
    >
      {children}
    </tbody>
  );
}

export function WTr({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement> & { children: ReactNode }) {
  return (
    <tr
      {...rest}
      className={cn("transition-colors hover:bg-surface-muted/70", className)}
    >
      {children}
    </tr>
  );
}

export function WTd({
  children,
  align = "left",
  truncate = false,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: "left" | "right" | "center";
  /**
   * When true, force the cell to clamp via `max-w-0` and ellipsis. By default
   * cells render their content single-line at natural width so wide content
   * (long product names, IDs, etc.) makes the wrapping `WorkspaceTableShell`
   * scroll horizontally instead of clipping content.
   */
  truncate?: boolean;
}) {
  const body = truncate ? (
    <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{children}</div>
  ) : (
    children
  );
  return (
    <td
      {...rest}
      className={cn(
        "whitespace-nowrap px-3 py-2.5 align-middle text-text-primary",
        truncate && "max-w-0",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className,
      )}
    >
      {body}
    </td>
  );
}
