// ---------------------------------------------------------------------------
// Contract Transition — unified types (Queue ingest + renewals + amendments)
// ---------------------------------------------------------------------------

export type ContractState =
  | "draft"
  | "active"
  | "expiring"
  | "extended"
  | "renewed"
  | "superseded"
  | "terminated";

export type ContractTransitionType = "new_deal" | "early_renewal" | "amendment";

export type ContractTransitionStatus = "draft" | "pending_approval" | "approved" | "executed";

export type ContractTransition = {
  id: string;
  type: ContractTransitionType;
  customerId: string;
  fromContractId?: string;
  toContractId?: string;
  status: ContractTransitionStatus;
  executionMode: "immediate" | "scheduled";
  executionDate?: string;
  settlement?: {
    method: "credit_note" | "refund" | "charge_difference" | "defer";
    amount: number;
  };
  billingConfig?: {
    mode: "prepaid" | "postpaid";
    invoiceTiming: "on_approval" | "on_activation";
  };
  approvalPolicy?: {
    futureInvoices: "always" | "if_changed" | "never";
  };
};

export type ActivationConfig = {
  startDate: string;
  activationMode: "immediate" | "scheduled";
  invoiceTrigger: "on_approval" | "on_activation";
};

export type ContractTimers = {
  endDate: string;
  grace?: {
    enabled: boolean;
    startDate: string;
    endDate: string;
    billingMode: "continue" | "pause";
  };
  extension?: {
    markedAt: string;
  };
};

export type EntityState =
  | "queued"
  | "in_progress"
  | "draft"
  | "ready"
  | "pending_approval"
  | "approved"
  | "executed";

export type DrawerEntityType = "queue_item" | "contract" | "invoice" | "transition";

export type DrawerMode = "ingest" | "transition" | "late_renewal" | "invoice_approval";

/** Unified ingest → invoice review → approval (and deep-linkable steps). */
export type FlowScenario = "ingest_invoice" | "invoice_only" | "late_grace" | "late_renewal_resolve";

export type FlowStepId =
  | "ingest"
  /** Early renewal: close prior active contract before renewal invoice review */
  | "close_prior"
  /** Late renewal: configure grace extension before policy approval */
  | "grace_extend"
  | "invoice_review"
  | "approval";

export type TransitionFlowSession = {
  /** Stable React key when switching queue items / steps quickly (filled by `openDrawer` if omitted). */
  key?: string;
  scenario: FlowScenario;
  step: FlowStepId;
  queueItemId?: string;
  invoiceId?: string;
  contractId?: string;
  customerId?: string;
  /** When false, hide the horizontal stepper (invoice-only / minimal). */
  showStepper?: boolean;
  /** Approver viewing prior ingest step without editing */
  ingestReadOnly?: boolean;
  /**
   * Furthest ingest-flow step the user may open via the stepper (Map & terms → Invoice review).
   * Starts at `ingest` until operator clicks **Next** (commit + advance).
   */
  furthestUnlockedStep?: FlowStepId;
};

export type DrawerState = {
  isOpen: boolean;
  entityType: DrawerEntityType;
  entityId?: string;
  mode?: DrawerMode;
  /** When set, `EntityDrawer` renders the unified transition shell (ingest / review / approval). */
  flow?: TransitionFlowSession | null;
  context?: {
    customerId?: string;
    contractId?: string;
    /** Late renewal: which step to open in the drawer */
    latePhase?: "extend" | "resolve";
    /** `invoice_approval` drawer: optional queue item for ingest-linked approvals */
    queueItemId?: string;
  };
};

export type TransitionDrawerIntent = "new_deal" | "amendment" | "early_renewal" | "late_extend";

export interface ContractGraceExtension {
  contractId: string;
  customerId: string;
  until: string;
  billingMode: "continue" | "pause";
  markedAt: string;
  /** When operator completes resolution flow */
  resolved?: boolean;
}

export function inferTransitionIntent(params: {
  hasExistingActiveContract: boolean;
  isModificationOnly?: boolean;
  hasNewContractDocument?: boolean;
  contractOperationalState?: ContractState;
}): TransitionDrawerIntent {
  if (params.contractOperationalState === "extended") {
    return "early_renewal"; // resolution uses late_renewal mode in drawer, not intent selector
  }
  if (params.hasExistingActiveContract && params.hasNewContractDocument) return "early_renewal";
  if (params.hasExistingActiveContract && params.isModificationOnly) return "amendment";
  return "new_deal";
}

export function transitionTypeFromIntent(intent: TransitionDrawerIntent): ContractTransitionType | null {
  if (intent === "new_deal") return "new_deal";
  if (intent === "early_renewal") return "early_renewal";
  if (intent === "amendment") return "amendment";
  return null;
}
