import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type IngestFieldGroupChipTone = "valid" | "warning" | "error" | "neutral";

export interface IngestFieldGroupChip {
  label: string;
  tone?: IngestFieldGroupChipTone;
}

interface IngestFieldGroupProps {
  title: string;
  subtitle?: string;
  chip?: IngestFieldGroupChip;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

const chipToneClass: Record<IngestFieldGroupChipTone, string> = {
  valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
  neutral: "border-border-subtle bg-white text-text-secondary",
};

/**
 * Subtle bordered grouping for the contract-extraction step's middle pane.
 * Shares header chrome with `SectionCard` so the two coexist visually, but adds
 * an optional live status chip that mirrors the validation rail.
 */
export const IngestFieldGroup = forwardRef<HTMLDivElement, IngestFieldGroupProps>(
  function IngestFieldGroup({ title, subtitle, chip, children, className, bodyClassName }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-2xl border border-border-default bg-white",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[14px] font-semibold leading-tight tracking-normal text-text-primary">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 truncate text-[12px] leading-snug text-text-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
          {chip ? (
            <span
              className={cn(
                "inline-flex max-w-[55%] shrink-0 items-center truncate rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4",
                chipToneClass[chip.tone ?? "neutral"],
              )}
              title={chip.label}
            >
              <span className="truncate">{chip.label}</span>
            </span>
          ) : null}
        </div>
        <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
      </div>
    );
  },
);
