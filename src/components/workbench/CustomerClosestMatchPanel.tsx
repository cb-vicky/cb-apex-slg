import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import { WTable, WTbody, WTr, WTd } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/primitives";
import {
  customerInitials,
  customerLinkStatus,
  formatCustomerCreatedAt,
  primaryContactEmail,
  primaryContactName,
} from "./customer-link-display";

export function ViewAllCustomersButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-fit items-center rounded-lg border border-border-default bg-white px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-text-primary"
    >
      View all customers
    </button>
  );
}

/** @deprecated Use ViewAllCustomersButton */
export const ViewSimilarMatchesButton = ViewAllCustomersButton;

interface Props {
  matches: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
  onViewAllCustomers: () => void;
  showViewAllCustomers?: boolean;
}

export function CustomerClosestMatchPanel({
  matches,
  selectedCustomerId,
  onSelectCustomer,
  onViewAllCustomers,
  showViewAllCustomers = true,
}: Props) {
  const customerColumns = [
    "",
    "Customer",
    "Status",
    "Primary contact",
    "Created at",
  ] as const;

  const matchCount = matches.length;

  function toggleCustomer(customerId: string) {
    onSelectCustomer(selectedCustomerId === customerId ? "" : customerId);
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      <div
        role="status"
        className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50"
      >
        <div className="flex items-center gap-2 px-4 py-3">
          <Sparkles size={16} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
          <p className="text-[13px] font-semibold leading-snug text-emerald-800">
            {matchCount} matches found
          </p>
        </div>

        <div className="border-t border-emerald-200/70 bg-white">
          <WTable className="w-full min-w-0 table-fixed text-[12px] [&_td:first-child]:!w-[34px] [&_td:first-child]:!min-w-[34px] [&_td:first-child]:!max-w-[34px] [&_td:first-child]:!pl-4 [&_td:first-child]:!pr-0 [&_td:first-child]:!text-left [&_td:nth-child(2)]:!pl-1 [&_td:nth-child(2)]:!pr-2 [&_th:first-child]:!w-[34px] [&_th:first-child]:!min-w-[34px] [&_th:first-child]:!max-w-[34px] [&_th:first-child]:!pl-4 [&_th:first-child]:!pr-0 [&_th:nth-child(2)]:!pl-1">
            <colgroup>
              <col style={{ width: 34 }} />
              <col className="w-[26%]" />
              <col className="w-[12%]" />
              <col className="w-[38%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border-subtle bg-gray-50">
                {customerColumns.map((label) => (
                  <th
                    key={label || "select"}
                    className={cn(
                      "py-1.5 font-normal text-left",
                      !label && "pl-4 pr-0",
                      label === "Customer" && "pl-1 pr-2",
                      label && label !== "Customer" && "px-2",
                    )}
                  >
                    <span className="block truncate text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {label || <span className="sr-only">Select</span>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <WTbody>
              {matches.map((customer) => {
                const selected = selectedCustomerId === customer.id;
                const contact = primaryContactName(customer);
                const email = primaryContactEmail(customer);
                const status = customerLinkStatus(customer);

                return (
                  <WTr
                    key={customer.id}
                    className={cn(
                      "cursor-pointer",
                      selected
                        ? "bg-blue-50/70 hover:bg-blue-50/80"
                        : "hover:bg-gray-50/80",
                    )}
                    onClick={() => toggleCustomer(customer.id)}
                  >
                    <WTd className="!pl-4 !pr-0 py-1.5">
                      <input
                        type="radio"
                        name="match-found-customer"
                        checked={selected}
                        readOnly
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCustomer(customer.id);
                        }}
                        className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                        aria-label={`Select ${customer.name}`}
                      />
                    </WTd>
                    <WTd className="max-w-0 !pl-1 !pr-2 py-1.5 whitespace-normal">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
                          {customerInitials(customer.name)}
                        </span>
                        <span className="truncate font-semibold text-text-primary">
                          {customer.name}
                        </span>
                      </div>
                    </WTd>
                    <WTd className="max-w-0 px-2 py-1.5 whitespace-normal">
                      <StatusBadge status={status} className="max-w-full py-px text-[11px]" />
                    </WTd>
                    <WTd className="max-w-0 px-2 py-1.5 whitespace-normal">
                      <div className="min-w-0 leading-tight">
                        <div className="truncate font-medium text-text-primary">{contact}</div>
                        <div className="truncate text-[11px] text-text-muted">{email}</div>
                      </div>
                    </WTd>
                    <WTd className="max-w-0 truncate px-2 py-1.5 text-[11px] tabular-nums text-text-secondary">
                      {formatCustomerCreatedAt(customer.createdAt)}
                    </WTd>
                  </WTr>
                );
              })}
            </WTbody>
          </WTable>
        </div>
      </div>

      {showViewAllCustomers ? (
        <ViewAllCustomersButton onClick={onViewAllCustomers} />
      ) : null}
    </div>
  );
}
