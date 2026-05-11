import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { customers, quotes } from "@/data/mock-data";
import type { Customer } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag, type FilterOption } from "@/components/index-page/FilterBar";
import { PageHeader } from "@/components/index-page/PageHeader";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countRenewalsIn30Days(customerList: Customer[]) {
  let count = 0;
  for (const c of customerList) {
    if (c.nextRenewalDate) {
      const days = Math.round((new Date(c.nextRenewalDate).getTime() - Date.now()) / 86400000);
      if (days <= 30 && days > 0) count++;
    }
  }
  return count;
}

function countPendingQuotes(customerList: Customer[]) {
  let count = 0;
  for (const c of customerList) {
    count += quotes.filter((q) => q.customerId === c.id && q.approval.status === "pending").length;
  }
  return count;
}

const listColumns: Column[] = [
  { key: "customer", label: "Customer", width: "180px", sortable: true },
  { key: "arr", label: "ARR", width: "100px", align: "right" },
  { key: "openAr", label: "Open AR", width: "100px", align: "right" },
  { key: "contracts", label: "Contracts", width: "80px", align: "right" },
  { key: "quotes", label: "Quotes", width: "80px", align: "right" },
  { key: "renewal", label: "Renewal", width: "110px", sortable: true },
  { key: "risk", label: "Risk", width: "120px" },
  { key: "owner", label: "Owner", width: "120px" },
];

const filterOptions: FilterOption[] = [
  { field: "Risk", label: "Risk", values: ["Healthy", "At Risk", "High Risk"] },
  { field: "Owner", label: "Owner", values: ["Sarah Chen", "Mike Ross", "Alex Kim"] },
  { field: "Renewal", label: "Renewal", values: ["< 30 days", "30-60 days", "60+ days"] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomersIndex() {
  const navigate = useNavigate();
  const { sessionCustomers } = useIngestContext();
  const [filters, setFilters] = useState<FilterTag[]>([]);

  const customersMerged = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    for (const c of sessionCustomers) {
      byId.set(c.id, c);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [sessionCustomers]);

  const { ref: scrollRef, isScrolled } = useScrolled();

  const renewalsIn30Days = useMemo(() => countRenewalsIn30Days(customersMerged), [customersMerged]);
  const pendingQuotesCount = useMemo(() => countPendingQuotes(customersMerged), [customersMerged]);

  const metrics: MetricCard[] = [
    { label: "Active customers", value: customersMerged.length },
    { label: "Renewals in 30 days", value: renewalsIn30Days, variant: renewalsIn30Days > 0 ? "warning" : "default" },
    { label: "Open AR total", value: currency(customersMerged.reduce((s, c) => s + c.openAr, 0)), variant: "danger" },
    { label: "Quotes pending", value: pendingQuotesCount, variant: pendingQuotesCount > 0 ? "warning" : "default" },
    { label: "At-risk customers", value: customersMerged.filter((c) => c.riskBadges.length > 0).length, variant: "danger" },
  ];

  return (
    <div className="flex flex-1 w-full flex-col bg-grey-100">
      <div ref={scrollRef} className={`sticky top-0 z-10 bg-grey-100 rounded-tl-[24px] px-6 pt-5 pb-3 transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.04)]" : ""}`}>
        <PageHeader title="Customers" createLabel="Create" />
      </div>
      <div className="flex flex-col gap-5 px-6 pt-2 pb-7">
        <MetricStrip metrics={metrics} />
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          resultCount={customersMerged.length}
          resultLabel="customers"
        />
        <ListTable columns={listColumns}>
          {customersMerged.map((c) => (
            <ListRow key={c.id} onClick={() => navigate(`/customers/${c.id}?tab=customer&from=customers`)}>
              <ListCell width="180px" className="font-medium text-text-primary">{c.name}</ListCell>
              <ListCell width="100px" align="right">
                {currency(c.arr)}
              </ListCell>
              <ListCell width="100px" align="right" className={c.openAr > 0 ? "text-red-600 font-medium" : ""}>
                {currency(c.openAr)}
              </ListCell>
              <ListCell width="80px" align="right">
                {c.activeContractCount}
              </ListCell>
              <ListCell width="80px" align="right">
                {c.openQuoteCount}
              </ListCell>
              <ListCell width="110px">{c.nextRenewalDate ? shortDate(c.nextRenewalDate) : "—"}</ListCell>
              <ListCell width="120px" noTruncate>
                {c.riskBadges.length > 0 ? <StatusBadge status={`${c.riskBadges.length} flags`} /> : <span className="text-emerald-600 text-[12px]">Healthy</span>}
              </ListCell>
              <ListCell width="120px">{c.billingOwner}</ListCell>
            </ListRow>
          ))}
        </ListTable>
      </div>
    </div>
  );
}
