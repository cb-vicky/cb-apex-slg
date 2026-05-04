import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formInputClass, formLabelClass } from "@/components/ui/form-field";

/** Flat drawer control: sentence-case label + native select + chevron. */
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
      <label htmlFor={id} className={formLabelClass}>
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
        className={cn(formInputClass, "cursor-pointer appearance-none pr-9", className)}
        {...props}
      />
      <ChevronDown
        size={14}
        strokeWidth={2}
        className="pointer-events-none absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-text-muted"
        aria-hidden
      />
    </>
  );
}

/** Vertical rail + padding — nest fields under a parent control (see ingest drawer reference). */
export function DrawerRailIndent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mt-3 border-l-2 border-gray-200 pl-4", className)}>{children}</div>;
}

/** Sentence-case stacked label + control (drawer field rhythm). */
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
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className={formLabelClass}>{label}</span>
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
    <div className={cn("rounded-md border border-red-200 bg-red-50/40 px-4 py-2.5", className)}>
      <p className="min-w-0 text-[13px] font-semibold leading-snug text-red-700">{title}</p>
    </div>
  );
}
