import { useNavigate } from "react-router-dom";
import { openDrawer } from "@/store/drawer-store";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { invoices, customers } from "@/data/mock-data";
import { approvalRequestKindLabel } from "@/data/workbench-tasks";

const columns: Column[] = [
  { key: "kind", label: "Task type", width: "200px", sortable: true },
  { key: "id", label: "Approval ID", width: "150px", sortable: true },
  { key: "invoice", label: "Document", width: "140px", sortable: true },
  { key: "customer", label: "Customer", width: "160px", sortable: true },
  { key: "amount", label: "Amount", width: "110px", align: "right" },
  { key: "submitted", label: "Submitted By", width: "130px" },
  { key: "date", label: "Submitted On", width: "120px", sortable: true },
  { key: "status", label: "Status", width: "130px" },
];

export function ApprovalsTabContent() {
  const navigate = useNavigate();
  const { approvalRequests, invoiceStatusOverrides } = useIngestContext();
  const { persona } = useDemoPersona();

  const enriched = approvalRequests
    .filter((req) => !req.invoiceId.startsWith("INV-PENDING"))
    .map((req) => {
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
    { label: "Total requests", value: enriched.length },
    { label: "Total amount pending", value: currency(totalAmount), variant: totalAmount > 0 ? "warning" : "default" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {persona === "operator" && pendingCount > 0 && (
        <div className="rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-3 text-[12px] leading-snug text-amber-950">
          <span className="font-semibold">Operator view.</span> You can track submissions and status here.
          To approve or reject, switch to <span className="font-semibold">Approver</span> in the top bar
          (next to the bell).
        </div>
      )}
      <MetricStrip metrics={metrics} />

      {enriched.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-muted py-16 text-center">
          <p className="text-[14px] font-medium text-text-secondary">No approvals pending</p>
          <p className="mt-1 text-[12px] text-text-muted">
            Approvals will appear here once a document is submitted for review.
          </p>
        </div>
      ) : (
        <ListTable columns={columns} resultCount={enriched.length} resultLabel="approvals">
          {enriched.map((req) => (
            <ListRow
              key={req.id}
              onClick={() => {
                if (persona === "approver" && req.effectiveStatus === "Pending Approval") {
                  openDrawer({
                    entityType: "invoice",
                    mode: "invoice_approval",
                    entityId: req.invoiceId,
                    context: req.ingestId ? { queueItemId: req.ingestId } : undefined,
                    ...(req.ingestId
                      ? {
                          flow: {
                            scenario: "ingest_invoice",
                            step: "invoice_review",
                            furthestUnlockedStep: "invoice_review",
                            invoiceId: req.invoiceId,
                            queueItemId: req.ingestId,
                          },
                        }
                      : {}),
                  });
                  return;
                }
                navigate(
                  req.ingestId
                    ? `/approvals/invoices/${req.invoiceId}?ingestId=${encodeURIComponent(req.ingestId)}`
                    : `/approvals/invoices/${req.invoiceId}`,
                );
              }}
            >
              <ListCell width="200px" className="font-medium text-text-primary">
                {approvalRequestKindLabel({
                  invoiceId: req.invoiceId,
                  ingestId: req.ingestId,
                })}
              </ListCell>
              <ListCell width="150px" className="font-medium text-blue-600">{req.id}</ListCell>
              <ListCell width="140px" className="font-medium text-text-primary">{req.invoiceId}</ListCell>
              <ListCell width="160px">{req.customerName}</ListCell>
              <ListCell width="110px" align="right" className="tabular-nums">
                {currency(req.amount)}
              </ListCell>
              <ListCell width="130px" className="text-text-secondary">{req.submittedBy}</ListCell>
              <ListCell width="120px" className="text-text-secondary">{shortDate(req.submittedAt)}</ListCell>
              <ListCell width="130px" noTruncate>
                <StatusBadge status={req.effectiveStatus} />
              </ListCell>
            </ListRow>
          ))}
        </ListTable>
      )}
    </div>
  );
}
