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

export interface ContractGraceExtension {
  contractId: string;
  customerId: string;
  until: string;
  billingMode: "continue" | "pause";
  /** When billingMode = "pause": whether to keep provisioning active during the grace period. */
  provisioningDuringGrace?: boolean;
  /** When billingMode = "continue": whether to keep dunning if invoices go unpaid during grace. */
  dunningDuringGrace?: boolean;
  markedAt: string;
  /** When operator completes resolution flow */
  resolved?: boolean;
}

