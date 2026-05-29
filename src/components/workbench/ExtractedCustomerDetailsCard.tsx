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
}

export function ExtractedCustomerDetailsCard({ summary, className, needsAction, linked }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border-default bg-gray-100 px-3 py-2",
        needsAction && "border-l-[3px] border-l-red-500",
        linked && "border-l-[3px] border-l-emerald-500",
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
