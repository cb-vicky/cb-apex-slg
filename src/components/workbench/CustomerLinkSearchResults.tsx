import { ExternalLink, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formInputClass } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";
import { WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";
import type { Customer } from "@/data/mock-data";
import {
  customerBillingAddress,
  customerInitials,
  customerLinkStatus,
  customerNetPaymentTerms,
  customerSubscriptionLabel,
  formatCustomerCreatedAt,
  primaryContactEmail,
  primaryContactName,
} from "./customer-link-display";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCustomerId: string;
  selectedCustomerName?: string;
  onClearSelection?: () => void;
  customersCount: number;
  className?: string;
}

export function CustomerLinkSearchBar({
  search,
  onSearchChange,
  selectedCustomerId,
  selectedCustomerName,
  onClearSelection,
  customersCount,
  className,
}: SearchBarProps) {
  const searchQuery = search.trim();

  const resultsLabel = searchQuery
    ? `${customersCount} ${customersCount === 1 ? "result" : "results"} for "${searchQuery}"`
    : `${customersCount} ${customersCount === 1 ? "customer" : "customers"}`;

  const selectedName =
    selectedCustomerName ??
    "";

  return (
    <div className={cn("flex items-center gap-4 bg-gray-100 py-3", className)}>
      <label className="w-[60%] shrink-0">
        <span className="sr-only">Search customers</span>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, domain, or ID"
            className={cn(formInputClass, "w-full pl-9")}
          />
        </div>
      </label>

      {selectedCustomerId && selectedName ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
          <span className="font-medium text-text-primary">{selectedName} selected</span>
          {onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 flex-1 text-[12px] font-medium text-text-primary">{resultsLabel}</div>
      )}
    </div>
  );
}

interface TableProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerLinkCustomerTable({
  customers,
  selectedCustomerId,
  onSelectCustomer,
}: TableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-white">
      {customers.length === 0 ? (
        <p className="px-4 py-6 text-center text-[13px] text-text-muted">
          No customers match your search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <WTable className="min-w-[960px]">
            <WThead>
              <WTh className="w-10 px-2">
                <span className="sr-only">Select</span>
              </WTh>
              <WTh>Customer</WTh>
              <WTh>Status</WTh>
              <WTh>Subscription</WTh>
              <WTh>Primary contact</WTh>
              <WTh>Net payment</WTh>
              <WTh>Created at</WTh>
              <WTh>Billing address</WTh>
            </WThead>
            <WTbody>
              {customers.map((customer) => {
                const selected = selectedCustomerId === customer.id;
                const contact = primaryContactName(customer);
                const email = primaryContactEmail(customer);
                const status = customerLinkStatus(customer);

                return (
                  <WTr
                    key={customer.id}
                    className={cn(
                      "group cursor-pointer",
                      selected && "bg-blue-50/60 hover:bg-blue-50/70",
                    )}
                    onClick={() => onSelectCustomer(customer.id)}
                  >
                    <WTd align="center" className="w-10 px-2">
                      <input
                        type="radio"
                        name="customer-link-select"
                        checked={selected}
                        onChange={() => onSelectCustomer(customer.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5 accent-blue-600"
                        aria-label={`Select ${customer.name}`}
                      />
                    </WTd>
                    <WTd>
                      <div className="flex min-w-[140px] items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                          {customerInitials(customer.name)}
                        </span>
                        <span className="font-semibold text-text-primary">{customer.name}</span>
                        <ExternalLink
                          size={13}
                          strokeWidth={2}
                          className="shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </div>
                    </WTd>
                    <WTd>
                      <StatusBadge status={status} />
                    </WTd>
                    <WTd className="text-text-secondary">{customerSubscriptionLabel(customer)}</WTd>
                    <WTd>
                      <div className="min-w-[140px] whitespace-normal">
                        <div className="font-medium text-text-primary">{contact}</div>
                        <div className="text-[12px] text-text-muted">{email}</div>
                      </div>
                    </WTd>
                    <WTd className="text-text-secondary">{customerNetPaymentTerms(customer)}</WTd>
                    <WTd className="text-text-secondary">{formatCustomerCreatedAt(customer.createdAt)}</WTd>
                    <WTd>
                      <span className="block max-w-[200px] whitespace-normal text-[12px] leading-snug text-text-secondary">
                        {customerBillingAddress(customer)}
                      </span>
                    </WTd>
                  </WTr>
                );
              })}
            </WTbody>
          </WTable>
        </div>
      )}
    </div>
  );
}

interface Props {
  customers: Customer[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedCustomerId: string;
  selectedCustomerName?: string;
  onSelectCustomer: (customerId: string) => void;
  onClearSelection?: () => void;
}

/** Default stacked layout — used when scroll pinning is not required. */
export function CustomerLinkSearchResults({
  customers,
  search,
  onSearchChange,
  selectedCustomerId,
  selectedCustomerName,
  onSelectCustomer,
  onClearSelection,
}: Props) {
  const resolvedSelectedName =
    customers.find((c) => c.id === selectedCustomerId)?.name ?? selectedCustomerName ?? "";

  return (
    <div className="flex flex-col gap-4">
      <CustomerLinkSearchBar
        search={search}
        onSearchChange={onSearchChange}
        selectedCustomerId={selectedCustomerId}
        selectedCustomerName={resolvedSelectedName}
        onClearSelection={onClearSelection}
        customersCount={customers.length}
        className="py-0"
      />
      <CustomerLinkCustomerTable
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onSelectCustomer={onSelectCustomer}
      />
    </div>
  );
}
