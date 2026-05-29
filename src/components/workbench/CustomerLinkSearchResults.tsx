import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formInputClass } from "@/components/ui/form-field";
import type { Customer } from "@/data/mock-data";

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function primaryContactName(customer: Customer): string {
  return customer.csm || customer.billingOwner || customer.ae;
}

function primaryContactEmail(customer: Customer): string {
  const name = primaryContactName(customer);
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const domain = customer.domain.replace(/^@/, "");
  if (!domain) return "—";
  if (parts.length >= 2) {
    return `${parts[0][0]}.${parts[parts.length - 1]}@${domain}`;
  }
  if (parts.length === 1) return `${parts[0]}@${domain}`;
  return `billing@${domain}`;
}

function chargebeeCustomerId(customer: Customer): string {
  if (customer.crmAccountId) {
    return customer.crmAccountId.replace(/^001Dn/i, "").slice(0, 14);
  }
  return customer.id.replace(/^cust_/, "").replace(/_/g, "");
}

function formatCreatedAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  customers: Customer[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedCustomerId: string;
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerLinkSearchResults({
  customers,
  search,
  onSearchChange,
  selectedCustomerId,
  onSelectCustomer,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchQuery = search.trim();

  const resultsLabel = searchQuery
    ? `${customers.length} ${customers.length === 1 ? "result" : "results"} for "${searchQuery}"`
    : `${customers.length} ${customers.length === 1 ? "customer" : "customers"}`;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-text-muted">
        Search your Chargebee site and pick the right customer.
      </p>

      <label className="flex flex-col gap-1.5">
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
            className={cn(formInputClass, "pl-9")}
          />
        </div>
      </label>

      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-medium text-text-primary">{resultsLabel}</span>
        <span className="text-text-muted">Click a row to expand</span>
      </div>

      <div className="overflow-hidden rounded-lg border border-border-default bg-white">
        {customers.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-text-muted">
            No customers match your search.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {customers.map((customer) => {
              const expanded = expandedId === customer.id;
              const selected = selectedCustomerId === customer.id;
              const contact = primaryContactName(customer);
              const email = primaryContactEmail(customer);

              return (
                <li key={customer.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId((prev) => (prev === customer.id ? null : customer.id))
                    }
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-muted/60",
                      selected && "bg-blue-50/50",
                    )}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[11px] font-semibold text-gray-600">
                      {customerInitials(customer.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-text-primary">
                        {customer.name}
                      </span>
                      <span className="block truncate text-[12px] text-text-muted">
                        {email} · {customer.region}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-2 sm:flex">
                      <span className="font-mono text-[11px] text-text-muted">
                        {chargebeeCustomerId(customer)}
                      </span>
                      {expanded ? (
                        <ChevronUp size={16} className="text-text-muted" />
                      ) : (
                        <ChevronDown size={16} className="text-text-muted" />
                      )}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="border-t border-border-subtle bg-gray-50/80 px-3 pb-3 pt-2">
                      <dl className="overflow-hidden rounded-md border border-border-default bg-white text-[12px]">
                        <MetadataRow label="Customer ID" value={chargebeeCustomerId(customer)} mono />
                        <MetadataRow label="Company" value={customer.name} />
                        <MetadataRow label="Legal name" value={customer.billingLegalEntity} />
                        <MetadataRow label="Primary contact" value={contact} />
                        <MetadataRow label="Email" value={email} />
                        <MetadataRow label="Country" value={customer.region} />
                        <MetadataRow label="Created" value={formatCreatedAt(customer.createdAt)} />
                        <MetadataRow
                          label="Active subscriptions"
                          value={String(customer.activeContractCount)}
                          last
                        />
                      </dl>

                      <div className="mt-3 flex items-center justify-end gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                        >
                          View in Chargebee
                          <ExternalLink size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCustomer(customer.id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-[12px] font-semibold transition-colors",
                            selected
                              ? "border-gray-300 text-text-primary shadow-sm"
                              : "border-border-default text-text-secondary hover:border-gray-300 hover:bg-surface-muted hover:text-text-primary",
                          )}
                        >
                          <Check size={14} strokeWidth={2.5} />
                          {selected ? "Mapped" : "Map this customer"}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function MetadataRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,38%)_1fr] gap-2 border-b border-border-subtle px-3 py-2",
        last && "border-b-0",
      )}
    >
      <dt className="text-text-muted">{label}</dt>
      <dd className={cn("text-text-primary", mono && "font-mono text-[11px]")}>{value}</dd>
    </div>
  );
}
