type Listener = () => void;

interface LinkCustomerModalState {
  isOpen: boolean;
  queueItemId: string | null;
}

const initial: LinkCustomerModalState = {
  isOpen: false,
  queueItemId: null,
};

let state: LinkCustomerModalState = initial;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getLinkCustomerModalState(): LinkCustomerModalState {
  return state;
}

export function subscribeLinkCustomerModal(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openLinkCustomerModal(queueItemId: string) {
  state = { isOpen: true, queueItemId };
  emit();
}

export function closeLinkCustomerModal() {
  state = { ...initial };
  emit();
}
