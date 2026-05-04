import type { DrawerState, FlowStepId, TransitionFlowSession } from "@/data/contract-transition";

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

function newFlowKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Merge partial fields into the active flow session (step, ids, flags).
 */
export function patchFlowSession(partial: Partial<TransitionFlowSession>) {
  if (!state.flow) return;
  state = {
    ...state,
    flow: { ...state.flow, ...partial },
  };
  emit();
}

export function setFlowStep(step: FlowStepId) {
  patchFlowSession({ step });
}

export function openDrawer(
  next: Omit<Partial<DrawerState>, "isOpen"> &
    Pick<DrawerState, "entityType"> & { skipUnifiedFlow?: boolean },
) {
  const baseKey = newFlowKey(`${next.entityType}-${next.entityId ?? "x"}`);
  const { flow: nextFlow, skipUnifiedFlow, ...rest } = next;
  let flow: TransitionFlowSession | null | undefined = nextFlow;

  if (flow === undefined) {
    if (
      !skipUnifiedFlow &&
      rest.mode === "ingest" &&
      rest.entityType === "queue_item" &&
      rest.entityId
    ) {
      flow = {
        key: baseKey,
        scenario: "ingest_invoice",
        step: "ingest",
        queueItemId: rest.entityId,
        furthestUnlockedStep: "ingest",
      };
    } else if (rest.mode === "invoice_approval" && rest.entityType === "invoice" && rest.entityId) {
      const qid = rest.context?.queueItemId;
      const hasIngestLink = Boolean(qid);
      flow = {
        key: baseKey,
        scenario: hasIngestLink ? "ingest_invoice" : "invoice_only",
        step: hasIngestLink ? "ingest" : "approval",
        showStepper: hasIngestLink,
        invoiceId: rest.entityId,
        queueItemId: qid,
        ...(hasIngestLink ? { furthestUnlockedStep: "ingest" as const } : {}),
      };
    } else {
      flow = null;
    }
  }

  if (flow && !flow.key) {
    flow = { ...flow, key: baseKey };
  }

  setDrawerState({
    ...rest,
    isOpen: true,
    flow: flow ?? null,
  });
}

export function closeDrawer() {
  state = { ...initial, isOpen: false };
  emit();
}
