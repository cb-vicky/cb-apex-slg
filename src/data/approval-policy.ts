// ---------------------------------------------------------------------------
// Approval policy types
// ---------------------------------------------------------------------------
//
// Captured via the merchant Approval Settings modal that appears the first
// time a user approves an invoice through an ingestion cycle. Stored on the
// IngestContext at session scope for the prototype.
// ---------------------------------------------------------------------------

export type ApprovalPolicyMode =
  | "auto-approve"
  | "always-approve"
  | "non-standard";

export interface NonStandardConditions {
  highTcv: boolean;
  highTcvThreshold: number;
  discountAboveThreshold: boolean;
  discountThresholdPct: number;
  customPaymentTerms: boolean;
  backdatedInvoice: boolean;
  manualLineItems: boolean;
}

export interface ApprovalPolicy {
  mode: ApprovalPolicyMode | null;
  conditions: NonStandardConditions;
}

export const DEFAULT_NON_STANDARD: NonStandardConditions = {
  highTcv: true,
  highTcvThreshold: 250000,
  discountAboveThreshold: true,
  discountThresholdPct: 25,
  customPaymentTerms: false,
  backdatedInvoice: true,
  manualLineItems: false,
};

export const DEFAULT_POLICY: ApprovalPolicy = {
  mode: null,
  conditions: DEFAULT_NON_STANDARD,
};

// ---------------------------------------------------------------------------
// Editable invoice field overrides
// ---------------------------------------------------------------------------
//
// Used by the Approval Detail page's "critical fields" card to override the
// invoice attributes that operators can adjust before sending.
// ---------------------------------------------------------------------------

export interface InvoiceFieldOverrides {
  amount?: number;
  dueDate?: string;
  paymentTerms?: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  taxRate?: number;
  poNumber?: string;
  memo?: string;
  invoiceDate?: string;
}

// ---------------------------------------------------------------------------
// Queue item runtime override (status flips after Finish Ingestion)
// ---------------------------------------------------------------------------

import type { QueueStatus } from "@/data/queue-data";

export interface QueueItemOverride {
  status?: QueueStatus;
  contractId?: string;
  invoiceId?: string;
  /** Set after ingest so queue row + drawer resolve the runtime customer. */
  customerId?: string;
}

// ---------------------------------------------------------------------------
// Pending Renewal Ingestion
// ---------------------------------------------------------------------------
// When a user triggers "Finish Ingestion" on an Early Renewal queue item,
// the renewal cannot be ingested until the prior contract's closure is approved.
// This record is stored in IngestContext keyed by the prior contractId so
// that after approval fires, the renewal is auto-created as Scheduled.
// ---------------------------------------------------------------------------

export interface PendingRenewalIngestion {
  queueItemId: string;
  sampleId: "sample3";
  renewalTcv: number;
  /** The customer ID the renewal is for. */
  customerId: string;
  /** The contract ID that will be created (from buildIngestResult). */
  pendingContractId: string;
}
