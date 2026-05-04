import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plug, Upload, FileText, Plug2, Sparkles, Mail } from "lucide-react";
import { useScrolled } from "@/hooks/useScrolled";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { MetricStrip, type MetricCard } from "@/components/index-page/MetricStrip";
import { GroupedSection } from "@/components/index-page/GroupedSection";
import { GroupedRow, RowCell } from "@/components/index-page/GroupedRow";
import { ListTable, ListRow, ListCell, type Column } from "@/components/index-page/ListTable";
import { PageHeader } from "@/components/index-page/PageHeader";
import { ViewToggle, type ViewMode } from "@/components/index-page/ViewToggle";
import { UploadModal } from "@/components/contracts/UploadModal";
import { QueueIntegrationsModal } from "@/components/queue/QueueIntegrationsModal";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { queueGroupMeta, type QueueItem, type QueueSource } from "@/data/queue-data";
import { openDrawer } from "@/store/drawer-store";

// ---------------------------------------------------------------------------
// Source badge — small inline indicator for PDF / API / CPQ / Email
// ---------------------------------------------------------------------------

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
      label: "Email",
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildGroups(items: QueueItem[]): Record<string, QueueItem[]> {
  const groups: Record<string, QueueItem[]> = {
    "pending-review": [],
    "in-progress": [],
    "invoice-review": [],
    ingested: [],
    failed: [],
  };
  for (const q of items) {
    for (const meta of queueGroupMeta) {
      if (meta.match(q)) {
        groups[meta.key].push(q);
        break;
      }
    }
  }
  return groups;
}

function rowSubtitle(q: QueueItem): string {
  // For ingested / failed items show context that matters
  if (q.status === "Ingested") return q.contractId ?? q.documentName;
  if (q.status === "Invoice review") return q.invoiceId ?? q.documentName;
  if (q.status === "Returned")
    return q.returnReason ? q.returnReason.slice(0, 80) : "Returned for revision";
  if (q.status === "Failed" || q.status === "Rejected")
    return q.failureReason ? q.failureReason.slice(0, 80) : q.documentName;
  return q.sourceDetail ?? q.documentName;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const listColumns: Column[] = [
  { key: "id", label: "Queue ID", width: "120px", sortable: true },
  { key: "doc", label: "Document", width: "260px", sortable: true },
  { key: "scenario", label: "Scenario", width: "120px" },
  { key: "customer", label: "Customer", width: "150px", sortable: true },
  { key: "tcv", label: "TCV", width: "110px", align: "right" },
  { key: "source", label: "Source", width: "110px" },
  { key: "uploaded", label: "Uploaded", width: "110px", sortable: true },
  { key: "status", label: "Status", width: "120px" },
];

export function QueueIndex() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { ref: scrollRef, isScrolled } = useScrolled();
  const { queueItems, approvalRequests } = useIngestContext();
  const { persona } = useDemoPersona();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);

  const groupFilter = searchParams.get("group");
  const viewMode = (searchParams.get("view") as ViewMode) || "groups";
  const groups = buildGroups(queueItems);

  function handleViewChange(mode: ViewMode) {
    const params = new URLSearchParams(searchParams);
    if (mode === "groups") {
      params.delete("view");
      params.delete("group");
    } else {
      params.set("view", mode);
      params.delete("group");
    }
    setSearchParams(params);
  }

  function handleRowClick(q: QueueItem) {
    const pendingInvoiceApproval = approvalRequests.find(
      (r) => r.ingestId === q.id && r.status === "Pending Approval",
    );
    if (q.status === "Invoice review" && q.invoiceId) {
      openDrawer({
        entityType: "queue_item",
        mode: "ingest",
        entityId: q.id,
        flow: {
          scenario: "ingest_invoice",
          step: "invoice_review",
          furthestUnlockedStep: "invoice_review",
          queueItemId: q.id,
          invoiceId: q.invoiceId,
          contractId: q.contractId,
          customerId: q.customerId,
        },
      });
      return;
    }
    if (q.status === "Returned" && q.ingestable) {
      openDrawer({ entityType: "queue_item", mode: "ingest", entityId: q.id });
      return;
    }
    if (q.status === "Ingested" && persona === "approver" && q.invoiceId && pendingInvoiceApproval) {
      openDrawer({
        entityType: "invoice",
        mode: "invoice_approval",
        entityId: q.invoiceId,
        context: { queueItemId: q.id },
        flow: {
          scenario: "ingest_invoice",
          step: "invoice_review",
          furthestUnlockedStep: "invoice_review",
          invoiceId: q.invoiceId,
          queueItemId: q.id,
          contractId: q.contractId,
          customerId: q.customerId,
        },
      });
      return;
    }
    if (q.status === "Ingested" && q.customerId && q.contractId) {
      navigate(`/customers/${q.customerId}?tab=contract&contractId=${q.contractId}`);
      return;
    }
    if (q.status === "Failed" || q.status === "Rejected") {
      // No-op: rendered with disabled visual, but rows are still clickable
      // for parity. Navigate to the queue detail to show the failure state.
      navigate(`/queue/${q.id}`);
      return;
    }
    if (
      q.ingestable &&
      (q.status === "Pending Review" || q.status === "In Progress")
    ) {
      openDrawer({
        entityType: "queue_item",
        mode: "ingest",
        entityId: q.id,
      });
      return;
    }
    navigate(`/queue/${q.id}`);
  }

  const viewToggle = (
    <ViewToggle
      value={groupFilter ? "groups" : viewMode}
      onChange={handleViewChange}
      resourcePlural="Queue items"
    />
  );

  // Metrics
  const pendingCount = groups["pending-review"].length;
  const inProgressCount = groups["in-progress"].length;
  const invoiceReviewCount = groups["invoice-review"].length;
  const ingestedCount = groups["ingested"].length;
  const failedCount = groups["failed"].length;
  const tcvPending =
    groups["pending-review"].reduce((s, q) => s + q.tcv, 0) +
    groups["invoice-review"].reduce((s, q) => s + q.tcv, 0);

  const metrics: MetricCard[] = [
    { label: "Pending review", value: pendingCount, variant: pendingCount > 0 ? "warning" : "default" },
    { label: "In progress", value: inProgressCount },
    {
      label: "Invoice review",
      value: invoiceReviewCount,
      variant: invoiceReviewCount > 0 ? "warning" : "default",
    },
    { label: "TCV in queue", value: currency(tcvPending), variant: tcvPending > 0 ? "warning" : "default" },
    { label: "Recently ingested", value: ingestedCount },
    { label: "Failed / Rejected", value: failedCount, variant: failedCount > 0 ? "danger" : "default" },
  ];

  const secondaryActions = (
    <>
      <button
        type="button"
        onClick={() => setConnectOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-white px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
      >
        <Plug size={13} strokeWidth={2} />
        Connect
      </button>
    </>
  );

  const modal = (
    <>
      {uploadOpen && <UploadModal onClose={() => setUploadOpen(false)} />}
      {connectOpen && <QueueIntegrationsModal onClose={() => setConnectOpen(false)} />}
    </>
  );

  // ── Filtered group view (?group=…) ─────────────────────────────────────────
  if (groupFilter) {
    const gm = queueGroupMeta.find((g) => g.slug === groupFilter);
    const rows = groups[gm?.key ?? ""] ?? [];
    return (
      <>
        {modal}
        <div className="flex flex-1 w-full flex-col">
          <div
            ref={scrollRef}
            className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-gray-100 transition-shadow duration-200${
              isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""
            }`}
          >
            <PageHeader
              title="Queue"
              backLabel="Back to overview"
              backPath="/queue"
              filterLabel={gm?.label}
              createLabel="Import"
              onCreateClick={() => setUploadOpen(true)}
              secondaryActions={secondaryActions}
            />
          </div>
          <div className="flex flex-col gap-5 px-6 pt-5 pb-7">
            <MetricStrip metrics={metrics} />
            <ListTable columns={listColumns} resultCount={rows.length}>
              {rows.map((q) => (
                <ListRow key={q.id} onClick={() => handleRowClick(q)}>
                  <ListCell width="120px" className="font-medium text-blue-600">{q.id}</ListCell>
                  <ListCell width="260px" noTruncate className="text-[13px]">
                    <FileText size={14} className="shrink-0 text-text-muted" strokeWidth={2} />
                    <span className="min-w-0 truncate font-medium text-text-primary">
                      {q.documentName}
                      <span className="font-normal text-text-muted"> · {rowSubtitle(q)}</span>
                    </span>
                  </ListCell>
                  <ListCell width="120px" className="text-text-secondary">{q.scenario}</ListCell>
                  <ListCell width="150px" className="font-medium">{q.customerName}</ListCell>
                  <ListCell width="110px" align="right" className="tabular-nums">
                    {q.tcv > 0 ? currency(q.tcv) : "—"}
                  </ListCell>
                  <ListCell width="110px" noTruncate>
                    <SourceBadge source={q.source} detail={q.sourceDetail} />
                  </ListCell>
                  <ListCell width="110px" className="text-text-secondary">{shortDate(q.uploadedAt)}</ListCell>
                  <ListCell width="120px" noTruncate>
                    <StatusBadge status={q.status} />
                  </ListCell>
                </ListRow>
              ))}
            </ListTable>
          </div>
        </div>
      </>
    );
  }

  // ── All-list view (?view=all) ──────────────────────────────────────────────
  if (viewMode === "all") {
    return (
      <>
        {modal}
        <div className="flex flex-1 w-full flex-col">
          <div
            ref={scrollRef}
            className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-gray-100 transition-shadow duration-200${
              isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""
            }`}
          >
            <PageHeader
              title="Queue"
              createLabel="Import"
              onCreateClick={() => setUploadOpen(true)}
              viewToggle={viewToggle}
              secondaryActions={secondaryActions}
            />
          </div>
          <div className="flex flex-col gap-5 px-6 pt-5 pb-7">
            <MetricStrip metrics={metrics} />
            <ListTable columns={listColumns} resultCount={queueItems.length}>
              {queueItems.map((q) => (
                <ListRow key={q.id} onClick={() => handleRowClick(q)}>
                  <ListCell width="120px" className="font-medium text-blue-600">{q.id}</ListCell>
                  <ListCell width="260px" noTruncate className="text-[13px]">
                    <FileText size={14} className="shrink-0 text-text-muted" strokeWidth={2} />
                    <span className="min-w-0 truncate font-medium text-text-primary">
                      {q.documentName}
                      <span className="font-normal text-text-muted"> · {rowSubtitle(q)}</span>
                    </span>
                  </ListCell>
                  <ListCell width="120px" className="text-text-secondary">{q.scenario}</ListCell>
                  <ListCell width="150px" className="font-medium">{q.customerName}</ListCell>
                  <ListCell width="110px" align="right" className="tabular-nums">
                    {q.tcv > 0 ? currency(q.tcv) : "—"}
                  </ListCell>
                  <ListCell width="110px" noTruncate>
                    <SourceBadge source={q.source} detail={q.sourceDetail} />
                  </ListCell>
                  <ListCell width="110px" className="text-text-secondary">{shortDate(q.uploadedAt)}</ListCell>
                  <ListCell width="120px" noTruncate>
                    <StatusBadge status={q.status} />
                  </ListCell>
                </ListRow>
              ))}
            </ListTable>
          </div>
        </div>
      </>
    );
  }

  // ── Grouped landing (default) ──────────────────────────────────────────────
  return (
    <>
      {modal}
      <div className="flex flex-1 w-full flex-col">
        <div
          ref={scrollRef}
          className={`sticky top-0 z-10 bg-white rounded-tl-[24px] px-6 pt-3 pb-3 border-b border-gray-100 transition-shadow duration-200${
            isScrolled ? " shadow-[0_2px_8px_rgba(0,0,0,0.08)]" : ""
          }`}
        >
          <PageHeader
            title="Queue"
            createLabel="Import"
            onCreateClick={() => setUploadOpen(true)}
            viewToggle={viewToggle}
            secondaryActions={secondaryActions}
          />
        </div>
        <div className="flex flex-col gap-5 px-6 pt-5 pb-7">
          <MetricStrip metrics={metrics} />

          {queueGroupMeta.map((gm) => {
            const rows = groups[gm.key] ?? [];
            return (
              <GroupedSection
                key={gm.key}
                title={gm.label}
                count={rows.length}
                viewAllPath={`/queue?group=${gm.slug}`}
              >
                {rows.slice(0, 5).map((q) => (
                  <GroupedRow key={q.id} onClick={() => handleRowClick(q)}>
                    <RowCell width="120px" className="font-medium text-blue-600">{q.id}</RowCell>
                    <RowCell width="240px" noTruncate className="text-[13px]">
                      <FileText size={14} className="shrink-0 text-text-muted" strokeWidth={2} />
                      <span className="min-w-0 truncate font-medium text-text-primary">
                        {q.documentName}
                        <span className="font-normal text-text-muted"> · {rowSubtitle(q)}</span>
                      </span>
                    </RowCell>
                    <RowCell width="110px" className="text-text-secondary">{q.scenario}</RowCell>
                    <RowCell width="140px" className="font-medium text-text-primary">{q.customerName}</RowCell>
                    <RowCell width="110px" className="tabular-nums" align="right">
                      {q.tcv > 0 ? currency(q.tcv) : "—"}
                    </RowCell>
                    <RowCell width="110px" noTruncate>
                      <SourceBadge source={q.source} detail={q.sourceDetail} />
                    </RowCell>
                    <RowCell width="110px" className="text-text-secondary">{shortDate(q.uploadedAt)}</RowCell>
                  </GroupedRow>
                ))}
              </GroupedSection>
            );
          })}

          {/* Empty state if everything is empty (defensive — shouldn't happen with seed data) */}
          {Object.values(groups).every((g) => g.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-border-default bg-surface-muted py-16 text-center">
              <p className="text-[14px] font-medium text-text-secondary">No queue items</p>
              <p className="mt-1 text-[12px] text-text-muted">
                Import a signed contract or connect an external source to populate the queue.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
