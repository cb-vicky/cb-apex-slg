import { useCallback, useState } from "react";
import { NewDealCustomerLinkModal } from "@/components/workbench/NewDealCustomerLinkModal";
import { useIngestContext } from "@/context/IngestContext";
import type { QueueItem } from "@/data/queue-data";
import { needsNewDealCustomerLinkModal } from "@/lib/new-deal-customer-link";

/**
 * Intercepts New Business queue opens that still need customer resolution;
 * shows {@link NewDealCustomerLinkModal} before the ingest drawer.
 */
export function useNewDealCustomerLinkGate() {
  const { queueItems } = useIngestContext();
  const [pendingQueueItemId, setPendingQueueItemId] = useState<string | null>(null);

  const pendingQueueItem = pendingQueueItemId
    ? queueItems.find((q) => q.id === pendingQueueItemId) ?? null
    : null;

  const openQueueFlow = useCallback((q: QueueItem, otherwise: () => void) => {
    if (needsNewDealCustomerLinkModal(q)) {
      setPendingQueueItemId(q.id);
      return;
    }
    otherwise();
  }, []);

  const closeModal = useCallback(() => setPendingQueueItemId(null), []);

  const modal = pendingQueueItem ? (
    <NewDealCustomerLinkModal queueItem={pendingQueueItem} onClose={closeModal} />
  ) : null;

  return { openQueueFlow, modal };
}
