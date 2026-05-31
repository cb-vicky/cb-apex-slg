import { Building2, CircleCheck, Info, Link2, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import type { ExtractedCustomerSummary } from "@/lib/new-deal-customer-link";

interface Props {
  summary: ExtractedCustomerSummary;
  linkedCustomer?: Customer;
  className?: string;
}

export function CustomerLinkCondensedStrip({ summary, linkedCustomer, className }: Props) {
  const isLinked = !!linkedCustomer;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border-default bg-white py-2.5",
        !isLinked && "border-l-[3px] border-l-red-500",
        isLinked && "border-l-[3px] border-l-emerald-500",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px]">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-text-primary">
          <Building2 size={13} strokeWidth={1.75} className="shrink-0 text-text-muted" aria-hidden />
          <span className="truncate">{summary.company}</span>
        </span>
        <span className="text-text-muted" aria-hidden>
          ·
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 text-text-secondary">
          <User size={13} strokeWidth={1.75} className="shrink-0 text-text-muted" aria-hidden />
          <span className="truncate">{summary.contactName}</span>
        </span>
        <span className="text-text-muted" aria-hidden>
          ·
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5 text-text-secondary">
          <Mail size={13} strokeWidth={1.75} className="shrink-0 text-text-muted" aria-hidden />
          <span className="truncate">{summary.contactEmail}</span>
        </span>
      </div>

      {isLinked ? (
        <>
          <Link2 size={14} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-text-primary">
            <Building2 size={13} strokeWidth={1.75} className="shrink-0 text-text-muted" aria-hidden />
            <span className="truncate">{linkedCustomer.name}</span>
          </span>
          <span
            role="status"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-emerald-700"
          >
            <CircleCheck size={11} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
            Completed
          </span>
        </>
      ) : (
        <span
          role="status"
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium leading-4 text-red-700"
        >
          <Info size={11} strokeWidth={2} className="shrink-0 text-red-600" aria-hidden />
          No match
        </span>
      )}
    </div>
  );
}