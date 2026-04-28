import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Customer, Contract, ContractClosure } from "@/data/mock-data";
import type { IngestResult, ApprovalRequest, ApprovalComment } from "@/data/ingest-data";
import { seedApprovalComments } from "@/data/ingest-data";
import {
  queueItems as seedQueueItems,
  type QueueItem,
} from "@/data/queue-data";
import {
  DEFAULT_POLICY,
  type ApprovalPolicy,
  type InvoiceFieldOverrides,
  type QueueItemOverride,
  type PendingRenewalIngestion,
} from "@/data/approval-policy";

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface IngestContextValue {
  selectedSample: "sample1" | "sample2" | null;
  setSelectedSample: (s: "sample1" | "sample2" | null) => void;

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
    },
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

  // General renewal toast (separate from closure toast, for "Renewal scheduled" message)
  renewalToast: { message: string; customerId: string } | null;
  showRenewalToast: (message: string, customerId: string) => void;
  clearRenewalToast: () => void;
}

const IngestContext = createContext<IngestContextValue | null>(null);

export function useIngestContext(): IngestContextValue {
  const ctx = useContext(IngestContext);
  if (!ctx) throw new Error("useIngestContext must be used inside IngestProvider");
  return ctx;
}

export function IngestProvider({ children }: { children: ReactNode }) {
  const [selectedSample, setSelectedSample] = useState<"sample1" | "sample2" | null>(null);
  const [sessionCustomers, setSessionCustomers] = useState<Customer[]>([]);
  const [sessionProductSkus, setSessionProductSkus] = useState<string[]>([]);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [submittedInvoiceIds, setSubmittedInvoiceIds] = useState<Set<string>>(new Set());
  const [invoiceStatusOverrides, setInvoiceStatusOverrides] = useState<Record<string, string>>({});
  const [invoiceFieldOverrides, setInvoiceFieldOverrides] = useState<
    Record<string, InvoiceFieldOverrides>
  >({});
  const [queueOverrides, setQueueOverrides] = useState<Record<string, QueueItemOverride>>({});
  const [firstApprovalCompletedFor, setFirstApprovalCompletedFor] = useState<
    Record<string, boolean>
  >({});
  const [approvalPolicy, setApprovalPolicy] = useState<ApprovalPolicy>(DEFAULT_POLICY);
  const [contractClosures, setContractClosures] = useState<Record<string, ContractClosure>>({});
  const [creditNoteStatusOverrides, setCreditNoteStatusOverridesState] = useState<Record<string, string>>({});
  const [closureToast, setClosureToast] = useState<{ message: string; contractId: string } | null>(null);
  const [pendingRenewalIngestions, setPendingRenewalIngestionsState] = useState<Record<string, PendingRenewalIngestion>>({});
  const [sessionContracts, setSessionContracts] = useState<Contract[]>([]);
  const [renewalToast, setRenewalToast] = useState<{ message: string; customerId: string } | null>(null);

  function addSessionCustomer(c: Customer) {
    setSessionCustomers((prev) => [...prev.filter((x) => x.id !== c.id), c]);
  }

  function addSessionProductSku(sku: string) {
    setSessionProductSkus((prev) => (prev.includes(sku) ? prev : [...prev, sku]));
  }

  function addApprovalRequest(r: ApprovalRequest) {
    setApprovalRequests((prev) => [...prev.filter((x) => x.id !== r.id), r]);
  }

  function updateApprovalStatus(id: string, status: ApprovalRequest["status"]) {
    setApprovalRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
  }

  function addApprovalComment(approvalId: string, comment: ApprovalComment) {
    setApprovalRequests((prev) =>
      prev.map((r) =>
        r.id === approvalId ? { ...r, comments: [...r.comments, comment] } : r
      )
    );
  }

  function submitInvoiceForApproval(
    invoiceId: string,
    meta?: {
      customerId?: string;
      customerName?: string;
      invoiceAmount?: number;
      invoiceDate?: string;
    },
  ) {
    setSubmittedInvoiceIds((prev) => new Set([...prev, invoiceId]));
    const approvalId = `APR-${invoiceId}`;
    const existing = approvalRequests.find((r) => r.invoiceId === invoiceId);
    if (existing) return;
    const newRequest: ApprovalRequest = {
      id: approvalId,
      invoiceId,
      customerId: meta?.customerId ?? "",
      customerName: meta?.customerName ?? "",
      invoiceAmount: meta?.invoiceAmount ?? 0,
      invoiceDate: meta?.invoiceDate ?? new Date().toISOString().slice(0, 10),
      status: "Pending Approval",
      submittedBy: "Alex Nguyen",
      submittedAt: new Date().toISOString(),
      approver: "Sarah Chen, VP Revenue",
      comments: [...seedApprovalComments],
    };
    addApprovalRequest(newRequest);
  }

  function setInvoiceStatusOverride(invoiceId: string, status: string) {
    setInvoiceStatusOverrides((prev) => ({ ...prev, [invoiceId]: status }));
  }

  function setInvoiceFieldOverride(
    invoiceId: string,
    overrides: InvoiceFieldOverrides,
  ) {
    setInvoiceFieldOverrides((prev) => ({
      ...prev,
      [invoiceId]: { ...(prev[invoiceId] ?? {}), ...overrides },
    }));
  }

  function applyQueueItemOverride(id: string, override: QueueItemOverride) {
    setQueueOverrides((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...override } }));
  }

  function markFirstApprovalCompleted(ingestId: string) {
    setFirstApprovalCompletedFor((prev) => ({ ...prev, [ingestId]: true }));
  }

  function applyContractClosure(contractId: string, closure: ContractClosure) {
    setContractClosures((prev) => ({ ...prev, [contractId]: closure }));
  }

  function setCreditNoteStatusOverride(creditNoteId: string, status: string) {
    setCreditNoteStatusOverridesState((prev) => ({ ...prev, [creditNoteId]: status }));
  }

  function showClosureToast(message: string, contractId: string) {
    setClosureToast({ message, contractId });
  }

  function clearClosureToast() {
    setClosureToast(null);
  }

  function setPendingRenewalIngestion(contractId: string, data: PendingRenewalIngestion) {
    setPendingRenewalIngestionsState((prev) => ({ ...prev, [contractId]: data }));
  }

  function clearPendingRenewalIngestion(contractId: string) {
    setPendingRenewalIngestionsState((prev) => {
      const next = { ...prev };
      delete next[contractId];
      return next;
    });
  }

  function addSessionContract(c: Contract) {
    setSessionContracts((prev) => [...prev.filter((x) => x.id !== c.id), c]);
  }

  function showRenewalToast(message: string, customerId: string) {
    setRenewalToast({ message, customerId });
  }

  function clearRenewalToast() {
    setRenewalToast(null);
  }

  // Merge seed queue items with runtime overrides
  const mergedQueueItems = useMemo<QueueItem[]>(() => {
    return seedQueueItems.map((q) => {
      const ov = queueOverrides[q.id];
      if (!ov) return q;
      return { ...q, ...ov };
    });
  }, [queueOverrides]);

  return (
    <IngestContext.Provider
      value={{
        selectedSample,
        setSelectedSample,
        sessionCustomers,
        addSessionCustomer,
        sessionProductSkus,
        addSessionProductSku,
        ingestResult,
        setIngestResult,
        approvalRequests,
        addApprovalRequest,
        updateApprovalStatus,
        addApprovalComment,
        submittedInvoiceIds,
        submitInvoiceForApproval,
        invoiceStatusOverrides,
        setInvoiceStatusOverride,
        invoiceFieldOverrides,
        setInvoiceFieldOverride,
        queueItems: mergedQueueItems,
        applyQueueItemOverride,
        firstApprovalCompletedFor,
        markFirstApprovalCompleted,
        approvalPolicy,
        setApprovalPolicy,
        contractClosures,
        applyContractClosure,
        creditNoteStatusOverrides,
        setCreditNoteStatusOverride,
        closureToast,
        showClosureToast,
        clearClosureToast,
        pendingRenewalIngestions,
        setPendingRenewalIngestion,
        clearPendingRenewalIngestion,
        sessionContracts,
        addSessionContract,
        renewalToast,
        showRenewalToast,
        clearRenewalToast,
      }}
    >
      {children}
    </IngestContext.Provider>
  );
}
