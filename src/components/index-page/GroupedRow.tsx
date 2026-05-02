import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface Props {
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function GroupedRow({ onClick, children, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 px-4 py-3 text-left text-[13px] leading-tight transition-colors hover:bg-[#f0f2f5]/90",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RowCell({
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
        "flex min-w-0 items-center",
        noTruncate && "min-w-0",
        align === "right" && "justify-end text-right tabular-nums",
        align === "center" && "justify-center text-center",
        className,
      )}
      style={width ? { width, minWidth: width, maxWidth: width } : undefined}
    >
      {inner}
    </span>
  );
}
