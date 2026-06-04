import { createContext, useContext, type MutableRefObject } from "react";
import type { Customer, Contract, ContractClosure, Invoice } from "@/data/mock-data";
import type { IngestResult, ApprovalRequest, ApprovalComment } from "@/data/ingest-data";
import type { QueueItem } from "@/data/queue-data";
import type {
  ApprovalPolicy,
  InvoiceFieldOverrides,
  QueueItemOverride,
  PendingRenewalIngestion,
} from "@/data/approval-policy";
import type { ContractGraceExtension } from "@/data/contract-transition";

// ---------------------------------------------------------------------------
// Ingestion Session Types (new Customer 360 Ingestion Tab)
// ---------------------------------------------------------------------------

export type IngestionSectionId = "summary" | "items" | "billing" | "addresses" | "additional";
export type IngestionSectionState = "issues" | "review" | "done";
export type IngestionOverallStatus = "in_review" | "ready" | "awaiting_approval";

/** Operator-defined status tag for ingestion workflow */
export type IngestionOperatorStatus = "in_review" | "awaiting_data" | "on_hold" | "needs_clarification";

export interface IngestionSession {
  queueItemId: string;
  customerId: string;
  sampleId: "sample2" | "sample3" | "sample4" | "sample5";
  customerLink: "matched" | "created";
  overallStatus: IngestionOverallStatus;
  /** Custom operator-defined status tag */
  operatorStatus?: IngestionOperatorStatus;
  sections: Record<IngestionSectionId, IngestionSectionState>;
  startedAt: string;
}

// ---------------------------------------------------------------------------
// Context value (stable module — survives Vite Fast Refresh)
// ---------------------------------------------------------------------------

export interface IngestContextValue {
  selectedSample: "sample2" | "sample3" | "sample4" | "sample5" | null;
  setSelectedSample: (s: "sample2" | "sample3" | "sample4" | "sample5" | null) => void;

  sessionCustomers: Customer[];
  addSessionCustomer: (c: Customer) => void;
  sessionProductSkus: string[];
  addSessionProductSku: (sku: string) => void;

  ingestResult: IngestResult | null;
  setIngestResult: (r: IngestResult | null) => void;

  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (r: ApprovalRequest) => void;
  updateApprovalStatus: (id: string, status: ApprovalRequest["status"]) => void;
  addApprovalComment: (approvalId: string, comment: ApprovalComment) => void;

  submittedInvoiceIds: Set<string>;
  submitInvoiceForApproval: (
    invoiceId: string,
    meta?: {
      customerId?: string;
      customerName?: string;
      invoiceAmount?: number;
      invoiceDate?: string;
      /** Queue item id for first-invoice-from-ingest (Workbench / deep links use `?ingestId=`). */
      ingestId?: string;
    },
  ) => void;

  /**
   * Ensures an `ApprovalRequest` exists for this queue item so the ingest full-page Comments rail
   * can use `ApprovalCommentsCard` before ingest completes; merged into the real invoice approval on submit.
   */
  ensureQueueIngestDiscussion: (
    queueItemId: string,
    meta?: { customerId?: string; customerName?: string },
  ) => void;

  invoiceStatusOverrides: Record<string, string>;
  setInvoiceStatusOverride: (invoiceId: string, status: string) => void;

  // Editable invoice field overrides keyed by invoice ID
  invoiceFieldOverrides: Record<string, InvoiceFieldOverrides>;
  setInvoiceFieldOverride: (
    invoiceId: string,
    overrides: InvoiceFieldOverrides,
  ) => void;

  // Queue items (merged seed + runtime overrides)
  queueItems: QueueItem[];
  applyQueueItemOverride: (id: string, override: QueueItemOverride) => void;
  /** Clears runtime queue overrides for an id (e.g. reject → operator starts from seed row). */
  clearQueueItemOverride: (id: string) => void;

  removeSessionInvoice: (invoiceId: string) => void;
  removeSessionContract: (contractId: string) => void;
  removeSessionCustomer: (customerId: string) => void;
  clearInvoiceFieldOverrides: (invoiceId: string) => void;
  clearInvoiceStatusOverride: (invoiceId: string) => void;
  removeSubmittedInvoiceId: (invoiceId: string) => void;
  removeApprovalsForInvoiceAndIngest: (invoiceId: string, ingestId?: string) => void;

  /**
   * Approver rejected an ingest-linked invoice: strip approval + session artifacts
   * so the operator can re-run the full ingest flow from the queue seed row.
   */
  returnIngestToOperatorAfterReject: (input: {
    queueItemId?: string;
    invoiceId: string;
    /** Session contract created during ingest (optional; removed with invoice). */
    contractId?: string;
    /** Shown on the queue row after return. */
    returnReason?: string;
  }) => void;

  // Per-ingest flag: true once the first invoice has been approved through
  // an ingestion cycle. Used to trigger the Approval Settings modal.
  firstApprovalCompletedFor: Record<string, boolean>;
  markFirstApprovalCompleted: (ingestId: string) => void;

  // Merchant-wide approval policy (one-time setup captured via modal)
  approvalPolicy: ApprovalPolicy;
  setApprovalPolicy: (p: ApprovalPolicy) => void;

  // Contract closures (runtime overrides for closing contracts)
  contractClosures: Record<string, ContractClosure>;
  applyContractClosure: (contractId: string, closure: ContractClosure) => void;

  // Credit note status overrides (for closure-generated credit notes)
  creditNoteStatusOverrides: Record<string, string>;
  setCreditNoteStatusOverride: (creditNoteId: string, status: string) => void;

  // Toast state for closure confirmation
  closureToast: { message: string; contractId: string } | null;
  showClosureToast: (message: string, contractId: string) => void;
  clearClosureToast: () => void;

  // Pending renewal ingestions: keyed by prior contractId
  // Set when "Finish Ingestion" is intercepted for an Early Renewal item.
  // Cleared after the closure approval fires and the renewal is auto-created.
  pendingRenewalIngestions: Record<string, PendingRenewalIngestion>;
  setPendingRenewalIngestion: (contractId: string, data: PendingRenewalIngestion) => void;
  clearPendingRenewalIngestion: (contractId: string) => void;

  // Session-created contracts (runtime Scheduled contracts from auto-ingest)
  sessionContracts: Contract[];
  addSessionContract: (c: Contract) => void;

  sessionInvoices: Invoice[];
  addSessionInvoice: (inv: Invoice) => void;

  // General renewal toast (separate from closure toast, for "Renewal scheduled" message)
  renewalToast: { message: string; customerId: string } | null;
  showRenewalToast: (message: string, customerId: string) => void;
  clearRenewalToast: () => void;

  /** Late renewal — grace extension metadata keyed by contract id */
  contractGraceExtensions: Record<string, ContractGraceExtension>;
  setContractGraceExtension: (contractId: string, ext: ContractGraceExtension | null) => void;

  /**
   * Last Workbench task-id snapshot (session-scoped), used to detect rows that
   * surface mid-session. Mutable ref avoids extra renders when the snapshot updates.
   */
  workbenchTaskSnapshotRef: MutableRefObject<string[]>;

  // ---------------------------------------------------------------------------
  // Ingestion Sessions (new Customer 360 Ingestion Tab)
  // ---------------------------------------------------------------------------

  /** Active ingestion sessions keyed by queueItemId */
  ingestionSessions: Record<string, IngestionSession>;

  /** Start a new ingestion session for a queue item */
  startIngestionSession: (
    queueItemId: string,
    customerId: string,
    sampleId: "sample2" | "sample3" | "sample4" | "sample5",
    customerLink: "matched" | "created",
  ) => void;

  /** Update a specific section's state */
  setIngestionSectionState: (
    queueItemId: string,
    section: IngestionSectionId,
    state: IngestionSectionState,
  ) => void;

  /** Update the overall status (in_review / ready / awaiting_approval) */
  setIngestionOverallStatus: (queueItemId: string, status: IngestionOverallStatus) => void;

  /** Update the operator-defined status tag */
  setIngestionOperatorStatus: (queueItemId: string, status: IngestionOperatorStatus | undefined) => void;

  /** Discard an ingestion session (clears it from state) */
  discardIngestion: (queueItemId: string) => void;

  /** Restart ingestion: resets sections to seed states, sets overallStatus to in_review */
  restartIngestion: (queueItemId: string) => void;

  /** Complete ingestion: clears the session (used after approver approves) */
  completeIngestion: (queueItemId: string) => void;

  /**
   * Active ingestion session for a customer, including a synthetic session when an
   * ingest-linked invoice is pending approval (approver review after operator submit).
   */
  getActiveIngestionForCustomer: (
    customerId: string,
    preferredQueueItemId?: string,
  ) => IngestionSession | undefined;
}

/** @internal — import from this module only in IngestProvider */
export const IngestContext = createContext<IngestContextValue | null>(null);

export function useIngestContext(): IngestContextValue {
  const ctx = useContext(IngestContext);
  if (!ctx) throw new Error("useIngestContext must be used inside IngestProvider");
  return ctx;
}
