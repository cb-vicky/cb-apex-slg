import { useNavigate } from "react-router-dom";
import { useScrolled } from "@/hooks/useScrolled";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";
import { useIngestContext } from "@/context/IngestContext";
import { invoices, customers } from "@/data/mock-data";

const columns: Column[] = [
  { key: "id", label: "Approval ID", width: "150px" },
  { key: "invoice", label: "Invoice", width: "140px" },
  { key: "customer", label: "Customer", width: "160px" },
  { key: "amount", label: "Amount", width: "110px" },
  { key: "submitted", label: "Submitted By", width: "130px" },
  { key: "date", label: "Submitted On", width: "120px" },
  { key: "status", label: "Status", width: "130px" },
];

export function ApprovalsIndex() {
  const navigate = useNavigate();
  const { ref: scrollRef, isScrolled } = useScrolled();
  const { approvalRequests, invoiceStatusOverrides } = useIngestContext();

  // Enrich approval requests with invoice + customer data
  const enriched = approvalRequests.map((req) => {
    const inv = invoices.find((i) => i.id === req.invoiceId);
    const cust = customers.find((c) => c.id === (inv?.customerId ?? req.customerId));
    const effectiveStatus = invoiceStatusOverrides[req.invoiceId] ?? req.status;
    return {
      ...req,
      invoiceId: req.invoiceId,
      customerName: cust?.name ?? req.customerName ?? "—",
      amount: inv?.amount ?? req.invoiceAmount,
      date: inv?.date ?? req.invoiceDate,
      effectiveStatus,
    };
  });

  const pendingCount = enriched.filter((r) => r.effectiveStatus === "Pending Approval").length;
  const totalAmount = enriched.reduce((s, r) => s + r.amount, 0);

  const metrics: MetricCard[] = [
    { label: "Pending approvals", value: pendingCount, variant: pendingCount > 0 ? "warning" : "default" },
    { label: "Invoice approvals", value: enriched.length },
    { label: "Total amount pending", value: currency(totalAmount), variant: totalAmount > 0 ? "warning" : "default" },
  ];

  return (
    <div className="flex flex-1 w-full flex-col">
      <div
        ref={scrollRef}
        className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-[#F0F1F3] transition-shadow duration-200${isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""}`}
      >
        <PageHeader title="Approvals" />
      </div>

      <div className="flex flex-col gap-3 px-6 pt-3 pb-5">
        <MetricStrip metrics={metrics} />

        {enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-muted py-16 text-center">
            <p className="text-[14px] font-medium text-text-secondary">No approvals pending</p>
            <p className="mt-1 text-[12px] text-text-muted">
              Approvals will appear here once an invoice is submitted for review.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Invoice Approvals
            </p>
            <ListTable columns={columns}>
              {enriched.map((req) => (
                <ListRow key={req.id} onClick={() => navigate(`/approvals/invoices/${req.invoiceId}`)}>
                  <ListCell width="150px" className="font-medium text-blue-600">{req.id}</ListCell>
                  <ListCell width="140px" className="font-medium text-text-primary">{req.invoiceId}</ListCell>
                  <ListCell width="160px">{req.customerName}</ListCell>
                  <ListCell width="110px" className="tabular-nums">{currency(req.amount)}</ListCell>
                  <ListCell width="130px" className="text-text-secondary">{req.submittedBy}</ListCell>
                  <ListCell width="120px" className="text-text-secondary">{shortDate(req.submittedAt)}</ListCell>
                  <ListCell width="130px">
                    <StatusBadge status={req.effectiveStatus} />
                  </ListCell>
                </ListRow>
              ))}
            </ListTable>
          </>
        )}
      </div>
    </div>
  );
}
