import { useEffect, useMemo } from "react";
import { ExternalLink, Search, Sparkles } from "lucide-react";
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
  formatCustomerCreatedAt,
  primaryContactEmail,
  primaryContactName,
} from "./customer-link-display";

interface MatchFirstBrowseSearchMeta {
  similarCustomersCount: number;
  showAllCustomers: boolean;
  onViewAllCustomers: () => void;
}

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCustomerId: string;
  selectedCustomerName?: string;
  onClearSelection?: () => void;
  customersCount: number;
  matchFirstBrowseMeta?: MatchFirstBrowseSearchMeta;
  className?: string;
}

export function CustomerLinkSearchBar({
  search,
  onSearchChange,
  selectedCustomerId,
  selectedCustomerName,
  onClearSelection,
  customersCount,
  matchFirstBrowseMeta,
  className,
}: SearchBarProps) {
  const searchQuery = search.trim();

  const resultsLabel = searchQuery
    ? `${customersCount} ${customersCount === 1 ? "result" : "results"} for "${searchQuery}"`
    : `${customersCount} ${customersCount === 1 ? "customer" : "customers"}`;

  const selectedName = selectedCustomerName ?? "";

  function renderBrowseMeta() {
    if (!matchFirstBrowseMeta) return resultsLabel;

    const { similarCustomersCount, showAllCustomers, onViewAllCustomers } = matchFirstBrowseMeta;
    const similarLabel = searchQuery
      ? `${customersCount} ${customersCount === 1 ? "result" : "results"} for "${searchQuery}"`
      : `${similarCustomersCount} similar ${similarCustomersCount === 1 ? "customer" : "customers"}`;
    const allLabel = searchQuery
      ? `${customersCount} ${customersCount === 1 ? "result" : "results"} for "${searchQuery}"`
      : `${customersCount} ${customersCount === 1 ? "customer" : "customers"}`;

    if (showAllCustomers) {
      return <span className="font-medium text-text-primary">{allLabel}</span>;
    }

    return (
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
        <span className="shrink-0 font-medium text-text-primary">{similarLabel}</span>
        <span className="h-3.5 w-px shrink-0 bg-border-default" aria-hidden />
        <button
          type="button"
          onClick={onViewAllCustomers}
          className="shrink-0 font-medium text-blue-600 transition-colors hover:text-blue-700"
        >
          View all customers
        </button>
      </div>
    );
  }

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
          {matchFirstBrowseMeta && !matchFirstBrowseMeta.showAllCustomers ? (
            <>
              {onClearSelection ? (
                <span className="h-3.5 w-px shrink-0 bg-border-default" aria-hidden />
              ) : null}
              <button
                type="button"
                onClick={matchFirstBrowseMeta.onViewAllCustomers}
                className="font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                View all customers
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <div className="min-w-0 flex-1 text-[12px]">{renderBrowseMeta()}</div>
      )}
    </div>
  );
}

interface TableProps {
  customers: Customer[];
  selectedCustomerId: string;
  /** Row that receives the Closest match pill in similar-matches browse. */
  closestMatchCustomerId?: string | null;
  /** Emerald row background for the closest match (off after reject). */
  highlightClosestMatchRow?: boolean;
  /** Other similar rows (shown with Match pill). */
  similarMatchCustomerIds?: string[];
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerLinkCustomerTable({
  customers,
  selectedCustomerId,
  closestMatchCustomerId = null,
  highlightClosestMatchRow = true,
  similarMatchCustomerIds = [],
  onSelectCustomer,
}: TableProps) {
  const similarMatchIdSet = useMemo(
    () => new Set(similarMatchCustomerIds),
    [similarMatchCustomerIds],
  );

  useEffect(() => {
    if (!closestMatchCustomerId) return;
    const row = document.querySelector(
      `[data-customer-link-row="${closestMatchCustomerId}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [closestMatchCustomerId, customers]);

  function toggleCustomer(customerId: string) {
    onSelectCustomer(selectedCustomerId === customerId ? "" : customerId);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border-default bg-white">
      {customers.length === 0 ? (
        <p className="px-4 py-4 text-center text-[13px] text-text-muted">
          No customers match your search.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <WTable className="min-w-[960px] w-full border-collapse [&_td]:!px-3 [&_td]:!py-2 [&_th]:!px-3 [&_th]:!py-2 [&_td:first-child]:!w-10 [&_td:first-child]:!pl-3 [&_td:first-child]:!pr-2 [&_th:first-child]:!w-10 [&_th:first-child]:!pl-3 [&_th:first-child]:!pr-2">
            <WThead>
              <WTh>
                <span className="sr-only">Select</span>
              </WTh>
              <WTh>Customer</WTh>
              <WTh>Status</WTh>
              <WTh>Primary contact</WTh>
              <WTh>Net payment</WTh>
              <WTh>Created at</WTh>
              <WTh>Billing address</WTh>
            </WThead>
            <WTbody>
              {customers.map((customer) => {
                const selected = selectedCustomerId === customer.id;
                const isClosestMatchLabel = closestMatchCustomerId === customer.id;
                const isSimilarMatch =
                  !isClosestMatchLabel && similarMatchIdSet.has(customer.id);
                const contact = primaryContactName(customer);
                const email = primaryContactEmail(customer);
                const status = customerLinkStatus(customer);

                return (
                  <WTr
                    key={customer.id}
                    data-customer-link-row={customer.id}
                    className={cn(
                      "group cursor-pointer",
                      highlightClosestMatchRow &&
                        isClosestMatchLabel &&
                        !selected &&
                        "bg-emerald-50/50 hover:bg-emerald-50/70",
                      isSimilarMatch && !selected && "bg-gray-50/60 hover:bg-gray-50/80",
                      selected && "bg-blue-50/60 hover:bg-blue-50/70",
                    )}
                    onClick={() => toggleCustomer(customer.id)}
                  >
                    <WTd align="center">
                      <input
                        type="radio"
                        name="customer-link-select"
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
                    <WTd>
                      <div className="flex min-w-[140px] items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-600">
                          {customerInitials(customer.name)}
                        </span>
                        <span className="font-semibold text-text-primary">{customer.name}</span>
                        {isClosestMatchLabel ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-500 bg-white px-1.5 py-px text-[10px] font-medium text-emerald-700">
                            <Sparkles
                              size={10}
                              strokeWidth={2}
                              className="text-emerald-600"
                              aria-hidden
                            />
                            Closest match
                          </span>
                        ) : isSimilarMatch ? (
                          <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border-default bg-white px-1.5 py-px text-[10px] font-medium text-text-muted">
                            <Sparkles
                              size={10}
                              strokeWidth={2}
                              className="text-blue-600"
                              aria-hidden
                            />
                            Match
                          </span>
                        ) : null}
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
