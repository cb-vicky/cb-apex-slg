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
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 px-4 py-2.5 text-left text-[13px] transition-colors hover:bg-surface-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function RowCell({ children, className, width }: { children: ReactNode; className?: string; width?: string }) {
  return (
    <span className={cn("min-w-0 overflow-visible whitespace-nowrap", className)} style={width ? { width, minWidth: width, maxWidth: width } : undefined}>
      {children}
    </span>
  );
}
