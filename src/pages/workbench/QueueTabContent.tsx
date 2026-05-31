import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plug, Upload, FileText, Plug2, Sparkles, Mail } from "lucide-react";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { UploadModal } from "@/components/contracts/UploadModal";
import { QueueIntegrationsModal } from "@/components/queue/QueueIntegrationsModal";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import type { QueueItem, QueueSource } from "@/data/queue-data";
import { queueItemKindLabel } from "@/data/workbench-tasks";
import { useNewDealCustomerLinkGate } from "@/hooks/useNewDealCustomerLinkGate";
import { openQueueIngestionTab } from "@/lib/new-deal-customer-link";

function SourceBadge({ source, detail }: { source: QueueSource; detail?: string }) {
  const config: Record<QueueSource, { icon: typeof FileText; tone: string; label: string }> = {
    "PDF Upload": {
      icon: Upload,
      tone: "border-gray-200 bg-gray-100 text-gray-600",
      label: "PDF",
    },
    API: {
      icon: Plug2,
      tone: "border-blue-200 bg-blue-50 text-blue-700",
      label: "via API",
    },
    CPQ: {
      icon: Sparkles,
      tone: "border-purple-200 bg-purple-50 text-purple-700",
      label: "via CPQ",
    },
    Email: {
      icon: Mail,
      tone: "border-gray-200 bg-gray-100 text-gray-600",
      label: "via Email",
    },
  };
  const { icon: Icon, tone, label } = config[source];
  return (
    <span
      title={detail}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 ${tone}`}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
    </span>
  );
}

function rowSubtitle(q: QueueItem): string {
  if (q.status === "Ingested") return q.contractId ?? q.documentName;
  if (q.status === "Invoice review") return q.invoiceId ?? q.documentName;
  if (q.status === "Returned")
    return q.returnReason ? q.returnReason.slice(0, 80) : "Returned for revision";
  if (q.status === "Failed" || q.status === "Rejected")
    return q.failureReason ? q.failureReason.slice(0, 80) : q.documentName;
  return q.sourceDetail ?? q.documentName;
}

const listColumns: Column[] = [
  { key: "kind", label: "Task type", width: "200px", sortable: true },
  { key: "id", label: "Queue ID", width: "120px", sortable: true },
  { key: "doc", label: "Document", width: "260px", sortable: true },
  { key: "scenario", label: "Scenario", width: "120px" },
  { key: "source", label: "Source", width: "120px" },
  { key: "tcv", label: "TCV", width: "110px", align: "right" },
  { key: "uploaded", label: "Uploaded", width: "110px", sortable: true },
  { key: "status", label: "Status", width: "120px" },
];

export function QueueTabToolbar() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  return (
    <>
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
      {connectOpen && <QueueIntegrationsModal onClose={() => setConnectOpen(false)} />}
      <div className="flex shrink-0 items-center gap-2 pb-2.5">
        <button
          type="button"
          onClick={() => setConnectOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-white px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          <Plug size={13} strokeWidth={2} />
          Connect
        </button>
        <button
          type="button"
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Upload size={13} strokeWidth={2} />
          Import
        </button>
      </div>
    </>
  );
}

export function QueueTabContent() {
  const navigate = useNavigate();
  const { queueItems, approvalRequests } = useIngestContext();
  const { persona } = useDemoPersona();
  const { openQueueFlow } = useNewDealCustomerLinkGate();

  function handleRowClick(q: QueueItem) {
    const pendingInvoiceApproval = approvalRequests.find(
      (r) => r.ingestId === q.id && r.status === "Pending Approval",
    );
    if (q.status === "Invoice review" && q.invoiceId && q.customerId) {
      navigate(`/customers/${q.customerId}?tab=invoicing&invoiceId=${q.invoiceId}`);
      return;
    }
    if (q.status === "Returned" && q.ingestable && q.customerId) {
      openQueueFlow(q, () => {
        openQueueIngestionTab(q.customerId!, q.id, navigate);
      });
      return;
    }
    if (q.status === "Ingested" && persona === "approver" && q.invoiceId && pendingInvoiceApproval && q.customerId) {
      navigate(`/customers/${q.customerId}?tab=invoicing&invoiceId=${q.invoiceId}`);
      return;
    }
    if (q.status === "Ingested" && q.customerId && q.contractId) {
      navigate(`/customers/${q.customerId}?tab=contract&contractId=${q.contractId}`);
      return;
    }
    if (q.status === "Failed" || q.status === "Rejected") {
      if (q.customerId) {
        navigate(`/customers/${q.customerId}?tab=ingestion&queueItemId=${q.id}`);
      }
      return;
    }
    if (
      q.ingestable &&
      (q.status === "Pending Review" || q.status === "In Progress")
    ) {
      openQueueFlow(q, () => {
        if (q.customerId) {
          openQueueIngestionTab(q.customerId, q.id, navigate);
        }
      });
      return;
    }
    if (q.customerId) {
      navigate(`/customers/${q.customerId}?tab=ingestion&queueItemId=${q.id}`);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {queueItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border-default bg-white py-16 text-center">
              <p className="text-[14px] font-medium text-text-secondary">No queue items</p>
              <p className="mt-1 text-[12px] text-text-muted">
                Import a signed contract or connect an external source to populate the queue.
              </p>
            </div>
      ) : (
        <ListTable
          columns={listColumns}
          scrollable
          maxBodyHeight="calc(100vh - 220px)"
        >
          {queueItems.map((q) => (
            <ListRow key={q.id} onClick={() => handleRowClick(q)}>
              <ListCell width="200px" className="font-medium text-text-primary">
                {queueItemKindLabel(q)}
              </ListCell>
              <ListCell width="120px" className="font-medium text-blue-600">{q.id}</ListCell>
              <ListCell width="260px" className="text-[13px]">
                <span className="inline-flex min-w-0 items-center gap-2">
                  <FileText size={14} className="shrink-0 text-text-muted" strokeWidth={2} />
                  <span className="font-medium text-text-primary">
                    {q.documentName}
                    <span className="font-normal text-text-muted"> · {rowSubtitle(q)}</span>
                  </span>
                </span>
              </ListCell>
              <ListCell width="120px" className="text-text-secondary">{q.scenario}</ListCell>
              <ListCell width="120px">
                <SourceBadge source={q.source} detail={q.sourceDetail} />
              </ListCell>
              <ListCell width="110px" align="right" className="tabular-nums">
                {q.tcv > 0 ? currency(q.tcv) : "—"}
              </ListCell>
              <ListCell width="110px" className="text-text-secondary">{shortDate(q.uploadedAt)}</ListCell>
              <ListCell width="120px">
                <StatusBadge status={q.status} />
              </ListCell>
            </ListRow>
          ))}
        </ListTable>
      )}
    </div>
  );
}
