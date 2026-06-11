import { Building2, Mail, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import { primaryContactEmail, primaryContactName } from "./customer-link-display";

/** Shared width for extracted ↔ linked customer cards in the link modal. */
export const CUSTOMER_LINK_CARD_WIDTH_CLASS = "w-[280px] shrink-0";

interface Props {
  customer: Customer;
  className?: string;
}

export function LinkedCustomerDetailsCard({ customer, className }: Props) {
  const contact = primaryContactName(customer);
  const email = primaryContactEmail(customer);

  return (
    <div
      className={cn(
        "rounded-lg border border-border-default bg-white px-3 py-2",
        CUSTOMER_LINK_CARD_WIDTH_CLASS,
        className,
      )}
    >
      <ul className="flex flex-col gap-1">
        <li className="flex items-center gap-2.5">
          <Building2 size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[13px] font-semibold leading-tight text-text-primary">
            {customer.name}
          </span>
        </li>
        <li className="flex items-center gap-2.5">
          <User size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[12px] leading-tight text-text-secondary">{contact}</span>
        </li>
        <li className="flex items-center gap-2.5">
          <Mail size={14} strokeWidth={1.75} className="shrink-0 text-text-muted" />
          <span className="truncate text-[12px] leading-tight text-text-secondary">{email}</span>
        </li>
      </ul>
    </div>
  );
}
