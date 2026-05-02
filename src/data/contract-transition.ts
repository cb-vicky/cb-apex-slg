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

export type DrawerState = {
  isOpen: boolean;
  entityType: DrawerEntityType;
  entityId?: string;
  mode?: DrawerMode;
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
