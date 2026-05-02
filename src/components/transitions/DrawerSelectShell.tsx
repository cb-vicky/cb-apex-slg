import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Flat drawer control: uppercase label + native select + chevron (matches TransitionIntentSelector). */
export function DrawerSelectShell({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={id}
        className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
      >
        {label}
      </label>
      <div className="relative">{children}</div>
    </div>
  );
}

export function DrawerNativeSelect({
  id,
  className,
  ...props
}: React.ComponentProps<"select"> & { id: string }) {
  return (
    <>
      <select
        id={id}
        className={cn(
          "w-full cursor-pointer appearance-none rounded-md border border-border-default bg-white py-2 pl-2.5 pr-9 text-[13px] text-text-primary shadow-sm outline-none transition-colors",
          "hover:border-neutral-300 hover:bg-neutral-50/60",
          "focus:border-neutral-300 focus:bg-neutral-50/80 focus:ring-1 focus:ring-neutral-200/90",
          "active:border-neutral-300 active:bg-neutral-100/80",
          "disabled:cursor-not-allowed disabled:bg-neutral-100/50 disabled:text-text-muted",
          className,
        )}
        {...props}
      />
      <ChevronDown
        size={14}
        strokeWidth={2.25}
        className="pointer-events-none absolute right-2.5 top-1/2 z-[1] -translate-y-1/2 text-neutral-400"
        aria-hidden
      />
    </>
  );
}

/** Vertical rail + padding — nest fields under a parent control (see ingest drawer reference). */
export function DrawerRailIndent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-2 border-l-2 border-neutral-200 pl-3", className)}>{children}</div>;
}

/** Uppercase stacked label + control (matches ingest drawer field rhythm). */
export function DrawerStackedField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

/** Ingest drawer / full page: extraction / mapping notice (flat surface, no icon). */
export function IngestDrawerIssueCallout({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border border-red-200 bg-white px-3 py-2.5", className)}>
      <p className="min-w-0 text-[12px] font-semibold leading-snug text-red-700">{title}</p>
    </div>
  );
}
