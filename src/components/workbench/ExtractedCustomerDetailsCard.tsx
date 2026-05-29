import { Building2, Mail, User } from "lucide-react";
import type { ExtractedCustomerSummary } from "@/lib/new-deal-customer-link";

interface Props {
  summary: ExtractedCustomerSummary;
  className?: string;
}

export function ExtractedCustomerDetailsCard({ summary, className }: Props) {
  return (
    <div
      className={[
        "rounded-lg border border-border-default bg-gray-100 px-3 py-2",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-2.5">
          <Building2 size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="text-[13px] font-semibold leading-tight text-text-primary">
            {summary.company}
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <User size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="text-[12px] leading-tight text-text-secondary">{summary.contactName}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <Mail size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="text-[12px] leading-tight text-text-secondary">{summary.contactEmail}</span>
        </li>
      </ul>
    </div>
  );
}
