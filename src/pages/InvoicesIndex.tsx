import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { invoices, customers } from "@/data/mock-data";
import { useIngestContext } from "@/context/IngestContext";
import { mergeInvoiceStatuses } from "@/components/revenue-workspace/derive-stage-data";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoicesIndex() {
  const navigate = useNavigate();
  const { invoiceStatusOverrides, sessionInvoices, sessionCustomers } = useIngestContext();

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
    <div className="flex flex-1 w-full flex-col">
      <div ref={scrollRef} className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-gray-100 transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""}`}>
        <PageHeader title="Invoices" />
      </div>
      <div className="flex flex-col gap-5 px-6 pt-5 pb-7">
        <MetricStrip metrics={metrics} />
        <ListTable columns={listColumns} resultCount={invoicesView.length}>
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
                <ListCell width="110px" noTruncate>
                  <StatusBadge status={inv.status} />
                </ListCell>
                <ListCell width="110px" className="text-text-secondary">{inv.owner}</ListCell>
                <ListCell width="160px" className="text-text-muted">{inv.holdReason || "—"}</ListCell>
              </ListRow>
            );
          })}
        </ListTable>
      </div>
    </div>
  );
}
