import { Building2, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedCustomerSummary } from "@/lib/new-deal-customer-link";

interface Props {
  summary: ExtractedCustomerSummary;
  className?: string;
  /** Red left accent when the operator still needs to resolve this customer. */
  needsAction?: boolean;
  /** Green left accent when linked to a site customer. */
  linked?: boolean;
  /** Green surface + strip after closest-match approve (pre-ingest ready state). */
  ready?: boolean;
}

export function ExtractedCustomerDetailsCard({
  summary,
  className,
  needsAction,
  linked,
  ready,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        ready
          ? "border-emerald-200 border-l-[3px] border-l-emerald-500 bg-emerald-50"
          : "border-border-default bg-gray-100",
        !ready && needsAction && "border-l-[3px] border-l-red-500",
        !ready && linked && "border-l-[3px] border-l-emerald-500",
        ready &&
          "motion-safe:animate-customer-link-ready-in motion-reduce:animate-none motion-reduce:opacity-100",
        className,
      )}
    >
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-2.5 min-w-0">
          <Building2 size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[13px] font-semibold leading-tight text-text-primary">
            {summary.company}
          </span>
        </li>
        <li className="flex items-center gap-2.5 min-w-0">
          <User size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[12px] leading-tight text-text-secondary">{summary.contactName}</span>
        </li>
        <li className="flex items-center gap-2.5 min-w-0">
          <Mail size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[12px] leading-tight text-text-secondary">{summary.contactEmail}</span>
        </li>
      </ul>
    </div>
  );
}
