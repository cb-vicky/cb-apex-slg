import { useCallback, useSyncExternalStore } from "react";
import { NewDealCustomerLinkModal } from "@/components/workbench/NewDealCustomerLinkModal";
import { useIngestContext } from "@/context/IngestContext";
import type { QueueItem } from "@/data/queue-data";
import { needsNewDealCustomerLinkModal } from "@/lib/new-deal-customer-link";
import {
  closeNewDealCustomerLinkModal,
  getNewDealCustomerLinkState,
  openNewDealCustomerLinkModal,
  subscribeNewDealCustomerLink,
} from "@/store/new-deal-customer-link-store";

/**
 * Intercepts New Business queue opens that still need customer resolution;
 * shows {@link NewDealCustomerLinkModal} before continuing to ingestion.
 */
export function useNewDealCustomerLinkGate() {
  const { queueItems } = useIngestContext();
  const { pendingQueueItemId } = useSyncExternalStore(
    subscribeNewDealCustomerLink,
    getNewDealCustomerLinkState,
    getNewDealCustomerLinkState,
  );

  const pendingQueueItem = pendingQueueItemId
    ? queueItems.find((q) => q.id === pendingQueueItemId) ?? null
    : null;

  const openQueueFlow = useCallback((q: QueueItem, otherwise: () => void) => {
    if (needsNewDealCustomerLinkModal(q)) {
      openNewDealCustomerLinkModal(q.id);
      return;
    }
    otherwise();
  }, []);

  const closeModal = useCallback(() => closeNewDealCustomerLinkModal(), []);

  const modal = pendingQueueItem ? (
    <NewDealCustomerLinkModal queueItem={pendingQueueItem} onClose={closeModal} />
  ) : null;

  return { openQueueFlow, modal };
}
