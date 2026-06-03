import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface IndexPageFrameProps {
  header: ReactNode;
  metrics?: ReactNode;
  filterBar?: ReactNode;
  children: ReactNode;
  /** Ref for scroll-shadow on sticky header (from useScrolled). */
  headerRef?: React.Ref<HTMLDivElement>;
  headerScrolled?: boolean;
}

/**
 * Shared index page shell: grey canvas with header + filters on the background;
 * metric cards and list table render as separate white surfaces.
 */
export function IndexPageFrame({
  header,
  metrics,
  filterBar,
  children,
  headerRef,
  headerScrolled,
}: IndexPageFrameProps) {
  return (
    <div className="flex w-full flex-1 flex-col bg-grey-100">
      <div
        ref={headerRef}
        className={cn(
          "sticky top-0 z-10 shrink-0 bg-grey-100 px-6 pt-5 pb-3 transition-shadow duration-200",
          headerScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        )}
      >
        {header}
      </div>
      <div className="flex flex-col gap-5 px-6 pt-2 pb-7">
        {metrics ? <section aria-label="Summary metrics">{metrics}</section> : null}
        {filterBar ? <section aria-label="Filters">{filterBar}</section> : null}
        <section aria-label="Results">{children}</section>
      </div>
    </div>
  );
}
