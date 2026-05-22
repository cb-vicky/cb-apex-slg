import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { invoices, customers } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { FilterBar, type FilterTag, type FilterOption } from "@/components/index-page/FilterBar";
import { PageHeader } from "@/components/index-page/PageHeader";
import { IndexPageFrame } from "@/components/index-page/IndexPageFrame";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countPendingReview(source: typeof invoices) {
  return source.filter((inv) => inv.status === "Pending Review" || inv.status === "Pending Approval").length;
}

function countOverdue(source: typeof invoices) {
  return source.filter((inv) => inv.status === "Overdue").length;
}

function countBlocked(source: typeof invoices) {
  return source.filter((inv) => inv.holdReason).length;
}

const listColumns: Column[] = [
  { key: "id", label: "Invoice ID", width: "130px", sortable: true },
  { key: "customer", label: "Customer", width: "150px", sortable: true },
  { key: "contract", label: "Contract", width: "130px" },
  { key: "amount", label: "Amount", width: "100px", align: "right" },
  { key: "due", label: "Due date", width: "100px", sortable: true },
  { key: "status", label: "Status", width: "110px" },
  { key: "owner", label: "Owner", width: "110px" },
  { key: "blocker", label: "Blocker", width: "160px" },
];

const filterOptions: FilterOption[] = [
  { field: "Status", label: "Status", values: ["Pending Review", "Pending Approval", "Paid", "Overdue", "Draft"] },
  { field: "Owner", label: "Owner", values: ["Sarah Chen", "Mike Ross", "Alex Kim"] },
  { field: "Blocker", label: "Blocker", values: ["Has blocker", "No blocker"] },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicesIndex() {
  const navigate = useNavigate();
  const { invoiceStatusOverrides, sessionInvoices, sessionCustomers } = useIngestContext();
  const [filters, setFilters] = useState<FilterTag[]>([]);

  const customersMerged = useMemo(() => {
    const byId = new Map(customers.map((c) => [c.id, c]));
    for (const c of sessionCustomers) {
      byId.set(c.id, c);
    }
    return [...byId.values()];
  }, [sessionCustomers]);

  const invoicesWithSession = useMemo(() => {
    const byId = new Map(invoices.map((i) => [i.id, i]));
    for (const inv of sessionInvoices) {
      byId.set(inv.id, inv);
    }
    return [...byId.values()];
  }, [sessionInvoices]);

  const invoicesView = useMemo(
    () => mergeInvoiceStatuses(invoicesWithSession, invoiceStatusOverrides),
    [invoicesWithSession, invoiceStatusOverrides],
  );

  const { ref: scrollRef, isScrolled } = useScrolled();

  const pendingCount = useMemo(() => countPendingReview(invoicesView), [invoicesView]);
  const overdueCount = useMemo(() => countOverdue(invoicesView), [invoicesView]);
  const blockedCount = useMemo(() => countBlocked(invoicesView), [invoicesView]);
  const openAr = invoicesView
    .filter((i) => i.status === "Overdue" || i.status === "Pending Review")
    .reduce((s, i) => s + i.amount, 0);

  const metrics: MetricCard[] = [
    { label: "Total invoices", value: invoicesView.length },
    { label: "Pending review", value: pendingCount, variant: pendingCount > 0 ? "warning" : "default" },
    { label: "Overdue", value: overdueCount, variant: overdueCount > 0 ? "danger" : "default" },
    { label: "Open AR", value: currency(openAr), variant: "danger" },
    { label: "Blocked", value: blockedCount, variant: blockedCount > 0 ? "warning" : "default" },
  ];

  return (
    <IndexPageFrame
      headerRef={scrollRef}
      headerScrolled={isScrolled}
      header={<PageHeader title="Invoices" />}
      metrics={<MetricStrip metrics={metrics} />}
      filterBar={
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          resultCount={invoicesView.length}
          resultLabel="invoices"
        />
      }
    >
      <ListTable columns={listColumns}>
        {invoicesView.map((inv) => {
          const c = customersMerged.find((cu) => cu.id === inv.customerId);
          return (
            <ListRow key={inv.id} onClick={() => navigate(`/customers/${inv.customerId}?tab=invoicing&invoiceId=${inv.id}&from=invoices`)}>
              <ListCell width="130px" className="font-medium text-blue-600">{inv.id}</ListCell>
              <ListCell width="150px" className="font-medium">{c?.name ?? "—"}</ListCell>
              <ListCell width="130px">{inv.contractId || "—"}</ListCell>
              <ListCell width="100px" align="right" className="tabular-nums">
                {currency(inv.amount)}
              </ListCell>
              <ListCell width="100px">{shortDate(inv.dueDate)}</ListCell>
              <ListCell width="110px">
                <StatusBadge status={inv.status} />
              </ListCell>
              <ListCell width="110px" className="text-text-secondary">{inv.owner}</ListCell>
              <ListCell width="160px" className="text-text-muted">{inv.holdReason || "—"}</ListCell>
            </ListRow>
          );
        })}
      </ListTable>
    </IndexPageFrame>
  );
}
