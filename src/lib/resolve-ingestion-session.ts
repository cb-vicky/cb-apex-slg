import type {
  IngestionSectionId,
  IngestionSectionState,
  IngestionSession,
} from "@/context/ingest-context-core";
import type { ApprovalRequest } from "@/data/ingest-data";
import type { QueueItem } from "@/data/queue-data";

function allSectionsDone(): Record<IngestionSectionId, IngestionSectionState> {
  return {
    summary: "done",
    items: "done",
    billing: "done",
    addresses: "done",
    additional: "done",
  };
}

/** Ephemeral session for approvers when the operator session was cleared after submit. */
export function buildApproverIngestionSession(
  queueItem: QueueItem,
  customerId: string,
): IngestionSession | undefined {
  const sampleId = queueItem.sampleId;
  if (sampleId !== "sample2" && sampleId !== "sample3" && sampleId !== "sample4") {
    return undefined;
  }
  return {
    queueItemId: queueItem.id,
    customerId,
    sampleId,
    customerLink: queueItem.customerId ? "matched" : "created",
    overallStatus: "awaiting_approval",
    sections: allSectionsDone(),
    startedAt: queueItem.uploadedAt,
  };
}

export function resolveIngestionSessionForCustomer(
  customerId: string,
  ingestionSessions: Record<string, IngestionSession>,
  queueItems: QueueItem[],
  approvalRequests: ApprovalRequest[],
  preferredQueueItemId?: string,
): IngestionSession | undefined {
  if (preferredQueueItemId) {
    const byId = ingestionSessions[preferredQueueItemId];
    if (byId?.customerId === customerId) return byId;
  }

  const active = Object.values(ingestionSessions).find((s) => s.customerId === customerId);
  if (active) return active;

  const ingestId =
    preferredQueueItemId ??
    approvalRequests.find(
      (r) =>
        r.customerId === customerId &&
        r.status === "Pending Approval" &&
        r.ingestId,
    )?.ingestId;

  if (!ingestId) return undefined;

  const pending = approvalRequests.some(
    (r) => r.ingestId === ingestId && r.status === "Pending Approval",
  );
  if (!pending) return undefined;

  const queueItem = queueItems.find((q) => q.id === ingestId);
  if (!queueItem) return undefined;

  const resolvedCustomerId = queueItem.customerId ?? customerId;
  if (resolvedCustomerId !== customerId) return undefined;

  return buildApproverIngestionSession(queueItem, customerId);
}
