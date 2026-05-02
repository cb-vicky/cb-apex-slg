import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { getQueueItem } from "@/data/queue-data";
import type { QueueItem } from "@/data/queue-data";
import { IngestDrawer } from "@/components/transitions/IngestDrawer";

// ---------------------------------------------------------------------------
// Placeholder / non-ingestable state
// ---------------------------------------------------------------------------

function PlaceholderState({ item, onBack }: { item: QueueItem; onBack: () => void }) {
  const isFailed = item.status === "Failed" || item.status === "Rejected";
  const lateRenewalWorkspace =
    item.scenario === "Late Renewal" && item.customerId && item.activeContractId
      ? `/customers/${item.customerId}?tab=contract&contractId=${item.activeContractId}`
      : null;

  return (
    <div className="flex flex-col items-start gap-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isFailed ? "bg-red-100" : "bg-amber-100",
          )}
        >
          {isFailed ? (
            <AlertCircle size={22} className="text-red-600" />
          ) : (
            <FileText size={22} className="text-amber-600" />
          )}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-text-primary">
            {isFailed
              ? `Document ${item.status.toLowerCase()}`
              : item.scenario === "Late Renewal"
                ? "Late renewal — workspace handoff"
                : item.scenario === "Amendment"
                  ? "Amendment ingestion — coming soon"
                  : "Document not yet processed"}
          </p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            {isFailed
              ? item.failureReason ?? "This document could not be processed."
              : item.scenario === "Late Renewal"
                ? "This queue item routes to the customer workspace: align the active contract, billing, and renewal timing for a late commercial renewal (no PDF extraction in this prototype)."
                : item.scenario === "Amendment"
                  ? "The amendment ingestion flow is not wired in this prototype."
                  : "Extraction has not been run for this queue item yet. Full ingestion runs on the Zenith (new business) and Verdant (early renewal) queue samples."}
          </p>
        </div>
      </div>

      <div className="w-full rounded-lg border border-border-default bg-surface-muted">
        <div className="border-b border-border-default px-4 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Document</p>
        </div>
        <div className="divide-y divide-border-subtle px-4">
          <div className="flex items-center justify-between py-2.5">
            <p className="text-[12px] text-text-muted">Document name</p>
            <p className="text-[13px] font-medium text-text-primary">{item.documentName}</p>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-[12px] text-text-muted">Source</p>
            <p className="text-[13px] font-medium text-text-primary">
              {item.source}
              {item.sourceDetail ? ` · ${item.sourceDetail}` : ""}
            </p>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-[12px] text-text-muted">Customer (extracted)</p>
            <p className="text-[13px] font-medium text-text-primary">{item.customerName}</p>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <p className="text-[12px] text-text-muted">Scenario</p>
            <p className="text-[13px] font-medium text-text-primary">{item.scenario}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lateRenewalWorkspace && (
          <Link
            to={lateRenewalWorkspace}
            className="inline-flex items-center gap-1 rounded-md bg-[#012A38] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#01374a]"
          >
            Open contract workspace
            <ChevronRight size={14} />
          </Link>
        )}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Back to Queue
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page — ingestable items use the same workspace as the drawer, in-page,
// with a dedicated comments column (see `IngestDrawer` presentation="page").
// ---------------------------------------------------------------------------

export function QueueIngestPage() {
  const navigate = useNavigate();
  const { queueItemId } = useParams<{ queueItemId: string }>();
  const { ref: stickyRef, isScrolled } = useScrolled();

  const queueItem = queueItemId ? getQueueItem(queueItemId) : undefined;
  const sampleId = queueItem?.sampleId ?? null;
  const ingestable = Boolean(queueItem?.ingestable && sampleId);

  if (!queueItem) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-[14px]">Queue item not found.</p>
        <button type="button" onClick={() => navigate("/queue")} className="mt-3 text-[12px] text-blue-600 hover:underline">
          Back to Queue
        </button>
      </div>
    );
  }

  if (!ingestable) {
    return (
      <div className="flex flex-1 w-full flex-col">
        <div
          ref={stickyRef}
          className={cn(
            "sticky top-0 z-10 flex w-full items-center justify-between gap-4 border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
            isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]",
          )}
        >
          <nav className="flex min-w-0 items-center gap-1 text-[12px] text-text-muted">
            <button
              type="button"
              onClick={() => navigate("/queue")}
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              Queue
            </button>
            <ChevronRight size={11} className="text-text-muted/50" />
            <span className="truncate max-w-[420px] font-medium text-text-primary">{queueItem.documentName}</span>
          </nav>
          <StatusBadge status={queueItem.status} />
        </div>
        <div className="px-6 py-5">
          <PlaceholderState item={queueItem} onBack={() => navigate("/queue")} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <IngestDrawer
        entityType="queue_item"
        mode="ingest"
        entityId={queueItem.id}
        onClose={() => navigate("/queue")}
        presentation="page"
      />
    </div>
  );
}
