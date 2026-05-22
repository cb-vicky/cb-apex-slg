import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  id: string;
  children: ReactNode;
  className?: string;
}

/** Scroll target for workspace in-page nav (`data-ws-section`). */
export function WorkspaceSectionAnchor({ id, children, className }: Props) {
  return (
    <div id={id} data-ws-section={id} className={cn("scroll-mt-28", className)}>
      {children}
    </div>
  );
}
