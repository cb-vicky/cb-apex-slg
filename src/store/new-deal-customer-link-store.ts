type Listener = () => void;
type State = { pendingQueueItemId: string | null };

let pendingQueueItemId: string | null = null;
const listeners = new Set<Listener>();

// Cache the snapshot object to avoid creating a new reference on every call.
// useSyncExternalStore compares by Object.is(), so returning a new object
// each time causes infinite re-render loops.
let cachedSnapshot: State = { pendingQueueItemId: null };

function emit() {
  // Update cached snapshot only when emitting (i.e., when value actually changed)
  cachedSnapshot = { pendingQueueItemId };
  listeners.forEach((l) => l());
}

export function getNewDealCustomerLinkState(): State {
  return cachedSnapshot;
}

export function subscribeNewDealCustomerLink(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openNewDealCustomerLinkModal(queueItemId: string) {
  pendingQueueItemId = queueItemId;
  emit();
}

export function closeNewDealCustomerLinkModal() {
  pendingQueueItemId = null;
  emit();
}
