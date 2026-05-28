import type { DrawerState } from "@/data/contract-transition";

type Listener = () => void;

const initial: DrawerState = {
  isOpen: false,
  entityType: "queue_item",
  flow: null,
};

let state: DrawerState = initial;
const listeners = new Set<Listener>();

export function getDrawerState(): DrawerState {
  return state;
}

export function subscribeDrawer(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  listeners.forEach((l) => l());
}

export function setDrawerState(partial: Partial<DrawerState> & { isOpen?: boolean }) {
  state = { ...state, ...partial };
  emit();
}

export function openDrawer(
  next: Omit<Partial<DrawerState>, "isOpen"> & Pick<DrawerState, "entityType">,
) {
  setDrawerState({
    ...next,
    isOpen: true,
    flow: null,
  });
}

export function closeDrawer() {
  state = { ...initial, isOpen: false };
  emit();
}
