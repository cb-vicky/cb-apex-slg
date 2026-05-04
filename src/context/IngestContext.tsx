import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import type { Customer, Contract, ContractClosure, Invoice } from "@/data/mock-data";
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
import type { ContractGraceExtension } from "@/data/contract-transition";
import { ZENITH_CUSTOMER_ID } from "@/data/zenith-ingest-session";

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

interface IngestContextValue {
  selectedSample: "sample2" | "sample3" | "sample4" | null;
  setSelectedSample: (s: "sample2" | "sample3" | "sample4" | null) => void;

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
}

const IngestContext = createContext<IngestContextValue | null>(null);

export function useIngestContext(): IngestContextValue {
  const ctx = useContext(IngestContext);
  if (!ctx) throw new Error("useIngestContext must be used inside IngestProvider");
  return ctx;
}

export function IngestProvider({ children }: { children: ReactNode }) {
  const [selectedSample, setSelectedSample] = useState<"sample2" | "sample3" | "sample4" | null>(null);
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
  const [sessionInvoices, setSessionInvoices] = useState<Invoice[]>([]);
  const [renewalToast, setRenewalToast] = useState<{ message: string; customerId: string } | null>(null);
  const [contractGraceExtensions, setContractGraceExtensionsState] = useState<
    Record<string, ContractGraceExtension>
  >({});
  const workbenchTaskSnapshotRef = useRef<string[]>([]);

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

  const ensureQueueIngestDiscussion = useCallback(
    (queueItemId: string, meta?: { customerId?: string; customerName?: string }) => {
      setApprovalRequests((prev) => {
        if (prev.some((r) => r.ingestId === queueItemId)) return prev;
        const stub: ApprovalRequest = {
          id: `APR-INGEST-${queueItemId}`,
          invoiceId: `INV-PENDING-${queueItemId}`,
          customerId: meta?.customerId ?? "",
          customerName: meta?.customerName ?? "—",
          invoiceAmount: 0,
          invoiceDate: new Date().toISOString().slice(0, 10),
          status: "Pending Approval",
          submittedBy: "Alex Nguyen",
          submittedAt: new Date().toISOString(),
          approver: "Sarah Chen, VP Revenue",
          comments: [],
          ingestId: queueItemId,
        };
        return [...prev, stub];
      });
    },
    [],
  );

  const submitInvoiceForApproval = useCallback(
    (
      invoiceId: string,
      meta?: {
        customerId?: string;
        customerName?: string;
        invoiceAmount?: number;
        invoiceDate?: string;
        ingestId?: string;
      },
    ) => {
      setSubmittedInvoiceIds((prev) => new Set([...prev, invoiceId]));
      setApprovalRequests((prev) => {
        const existingByInvoice = prev.find((r) => r.invoiceId === invoiceId);
        if (existingByInvoice) return prev;

        const ingestId = meta?.ingestId;
        const stub = ingestId
          ? prev.find(
              (r) =>
                r.ingestId === ingestId &&
                (r.id === `APR-INGEST-${ingestId}` || r.invoiceId === `INV-PENDING-${ingestId}`),
            )
          : undefined;

        const approvalId = `APR-${invoiceId}`;
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
          comments: stub ? [...stub.comments] : [...seedApprovalComments],
          ...(ingestId ? { ingestId } : {}),
        };

        const withoutStub = stub ? prev.filter((r) => r.id !== stub.id) : prev;
        return [...withoutStub.filter((r) => r.id !== approvalId), newRequest];
      });
    },
    [],
  );

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

  function clearQueueItemOverride(id: string) {
    setQueueOverrides((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function removeSessionInvoice(invoiceId: string) {
    setSessionInvoices((prev) => prev.filter((x) => x.id !== invoiceId));
  }

  function removeSessionContract(contractId: string) {
    setSessionContracts((prev) => prev.filter((x) => x.id !== contractId));
  }

  function removeSessionCustomer(customerId: string) {
    setSessionCustomers((prev) => prev.filter((x) => x.id !== customerId));
  }

  function clearInvoiceFieldOverrides(invoiceId: string) {
    setInvoiceFieldOverrides((prev) => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
  }

  function clearInvoiceStatusOverride(invoiceId: string) {
    setInvoiceStatusOverrides((prev) => {
      const next = { ...prev };
      delete next[invoiceId];
      return next;
    });
  }

  function removeSubmittedInvoiceId(invoiceId: string) {
    setSubmittedInvoiceIds((prev) => {
      const next = new Set(prev);
      next.delete(invoiceId);
      return next;
    });
  }

  function removeApprovalsForInvoiceAndIngest(invoiceId: string, ingestId?: string) {
    setApprovalRequests((prev) =>
      prev.filter(
        (r) =>
          !(r.invoiceId === invoiceId || Boolean(ingestId && r.ingestId === ingestId)),
      ),
    );
  }

  function returnIngestToOperatorAfterReject(input: {
    queueItemId?: string;
    invoiceId: string;
    contractId?: string;
    returnReason?: string;
  }) {
    const { queueItemId, invoiceId, contractId, returnReason } = input;
    removeApprovalsForInvoiceAndIngest(invoiceId, queueItemId);
    removeSubmittedInvoiceId(invoiceId);
    clearInvoiceFieldOverrides(invoiceId);
    clearInvoiceStatusOverride(invoiceId);
    removeSessionInvoice(invoiceId);
    if (contractId) {
      removeSessionContract(contractId);
    }
    if (queueItemId) {
      clearQueueItemOverride(queueItemId);
      applyQueueItemOverride(queueItemId, {
        status: "Returned",
        ...(returnReason ? { returnReason } : {}),
      });
    }
    removeSessionCustomer(ZENITH_CUSTOMER_ID);
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

  function addSessionInvoice(inv: Invoice) {
    setSessionInvoices((prev) => [...prev.filter((x) => x.id !== inv.id), inv]);
  }

  function showRenewalToast(message: string, customerId: string) {
    setRenewalToast({ message, customerId });
  }

  function clearRenewalToast() {
    setRenewalToast(null);
  }

  function setContractGraceExtension(contractId: string, ext: ContractGraceExtension | null) {
    setContractGraceExtensionsState((prev) => {
      const next = { ...prev };
      if (ext === null) delete next[contractId];
      else next[contractId] = ext;
      return next;
    });
  }

  // Check if late renewal should be unlocked:
  // - Zenith (QI-2026-0002) is Ingested
  // - Verdant (QI-2026-0006) is Ingested
  // - Northlane grace has been extended (contractGraceExtensions["CON-2025-0022"] exists)
  const lateRenewalUnlocked = useMemo(() => {
    const zenithOverride = queueOverrides["QI-2026-0002"];
    const verdantOverride = queueOverrides["QI-2026-0006"];
    const zenithDone = zenithOverride?.status === "Ingested";
    const verdantDone = verdantOverride?.status === "Ingested";
    const northlaneGraceExtended = Boolean(contractGraceExtensions["CON-2025-0022"]);
    return zenithDone && verdantDone && northlaneGraceExtended;
  }, [queueOverrides, contractGraceExtensions]);

  // Merge seed queue items with runtime overrides
  const mergedQueueItems = useMemo<QueueItem[]>(() => {
    return seedQueueItems.map((q) => {
      const ov = queueOverrides[q.id];
      let merged = ov ? { ...q, ...ov } : q;
      
      // Special handling for late renewal: make ingestable and restore to Pending Review when unlocked
      if (q.id === "QI-2026-0003" && lateRenewalUnlocked) {
        merged = { ...merged, ingestable: true, status: "Pending Review" };
      }
      
      return merged;
    });
  }, [queueOverrides, lateRenewalUnlocked]);

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
        ensureQueueIngestDiscussion,
        invoiceStatusOverrides,
        setInvoiceStatusOverride,
        invoiceFieldOverrides,
        setInvoiceFieldOverride,
        queueItems: mergedQueueItems,
        applyQueueItemOverride,
        clearQueueItemOverride,
        removeSessionInvoice,
        removeSessionContract,
        removeSessionCustomer,
        clearInvoiceFieldOverrides,
        clearInvoiceStatusOverride,
        removeSubmittedInvoiceId,
        removeApprovalsForInvoiceAndIngest,
        returnIngestToOperatorAfterReject,
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
        sessionInvoices,
        addSessionInvoice,
        renewalToast,
        showRenewalToast,
        clearRenewalToast,
        contractGraceExtensions,
        setContractGraceExtension,
        workbenchTaskSnapshotRef,
      }}
    >
      {children}
    </IngestContext.Provider>
  );
}
