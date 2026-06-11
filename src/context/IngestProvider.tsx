import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Customer, Contract, ContractClosure, Invoice } from "@/data/mock-data";
import type { IngestResult, ApprovalRequest, ApprovalComment } from "@/data/ingest-data";
import { seedApprovalComments, getExtractedContract } from "@/data/ingest-data";
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
import { resolveIngestionSessionForCustomer } from "@/lib/resolve-ingestion-session";
import {
  IngestContext,
  type IngestionSession,
  type IngestionSectionId,
  type IngestionSectionState,
  type IngestionOverallStatus,
  type IngestionOperatorStatus,
} from "@/context/ingest-context-core";

export function IngestProvider({ children }: { children: ReactNode }) {
  const [selectedSample, setSelectedSample] = useState<
    "sample2" | "sample3" | "sample4" | "sample5" | null
  >(null);
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
  const [ingestionSessions, setIngestionSessions] = useState<Record<string, IngestionSession>>({});

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

  // ---------------------------------------------------------------------------
  // Ingestion Session Handlers
  // ---------------------------------------------------------------------------

  function startIngestionSession(
    queueItemId: string,
    customerId: string,
    sampleId: "sample2" | "sample3" | "sample4" | "sample5",
    customerLink: "matched" | "created",
  ) {
    const extracted = getExtractedContract(sampleId);
    const sectionIssues = extracted.sectionIssues;

    const sections: Record<IngestionSectionId, IngestionSectionState> = {
      summary: sectionIssues.summary ? "issues" : "review",
      items: sectionIssues.items ? "issues" : "review",
      billing: sectionIssues.billing ? "issues" : "review",
      addresses: sectionIssues.addresses ? "issues" : "review",
      additional: sectionIssues.additional ? "issues" : "review",
    };

    const session: IngestionSession = {
      queueItemId,
      customerId,
      sampleId,
      customerLink,
      overallStatus: "in_review",
      sections,
      startedAt: new Date().toISOString(),
    };

    setIngestionSessions((prev) => ({ ...prev, [queueItemId]: session }));
  }

  function setIngestionSectionState(
    queueItemId: string,
    section: IngestionSectionId,
    state: IngestionSectionState,
  ) {
    setIngestionSessions((prev) => {
      const session = prev[queueItemId];
      if (!session) return prev;
      return {
        ...prev,
        [queueItemId]: {
          ...session,
          sections: { ...session.sections, [section]: state },
        },
      };
    });
  }

  function setIngestionOverallStatus(queueItemId: string, status: IngestionOverallStatus) {
    setIngestionSessions((prev) => {
      const session = prev[queueItemId];
      if (!session) return prev;
      return {
        ...prev,
        [queueItemId]: { ...session, overallStatus: status },
      };
    });
  }

  function setIngestionOperatorStatus(queueItemId: string, status: IngestionOperatorStatus | undefined) {
    setIngestionSessions((prev) => {
      const session = prev[queueItemId];
      if (!session) return prev;
      return {
        ...prev,
        [queueItemId]: { ...session, operatorStatus: status },
      };
    });
  }

  function discardIngestion(queueItemId: string) {
    setIngestionSessions((prev) => {
      const next = { ...prev };
      delete next[queueItemId];
      return next;
    });
  }

  function restartIngestion(queueItemId: string) {
    setIngestionSessions((prev) => {
      const session = prev[queueItemId];
      if (!session) return prev;

      const extracted = getExtractedContract(session.sampleId);
      const sectionIssues = extracted.sectionIssues;

      const sections: Record<IngestionSectionId, IngestionSectionState> = {
        summary: sectionIssues.summary ? "issues" : "review",
        items: sectionIssues.items ? "issues" : "review",
        billing: sectionIssues.billing ? "issues" : "review",
        addresses: sectionIssues.addresses ? "issues" : "review",
        additional: sectionIssues.additional ? "issues" : "review",
      };

      return {
        ...prev,
        [queueItemId]: {
          ...session,
          overallStatus: "in_review",
          sections,
        },
      };
    });
  }

  function completeIngestion(queueItemId: string) {
    discardIngestion(queueItemId);
  }

  // Merge seed queue items with runtime overrides
  const mergedQueueItems = useMemo<QueueItem[]>(() => {
    return seedQueueItems.map((q) => {
      const ov = queueOverrides[q.id];
      return ov ? { ...q, ...ov } : q;
    });
  }, [queueOverrides]);

  const getActiveIngestionForCustomer = useCallback(
    (customerId: string, preferredQueueItemId?: string): IngestionSession | undefined => {
      return resolveIngestionSessionForCustomer(
        customerId,
        ingestionSessions,
        mergedQueueItems,
        approvalRequests,
        preferredQueueItemId,
      );
    },
    [ingestionSessions, mergedQueueItems, approvalRequests],
  );

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
        ingestionSessions,
        startIngestionSession,
        setIngestionSectionState,
        setIngestionOverallStatus,
        setIngestionOperatorStatus,
        discardIngestion,
        restartIngestion,
        completeIngestion,
        getActiveIngestionForCustomer,
      }}
    >
      {children}
    </IngestContext.Provider>
  );
}
