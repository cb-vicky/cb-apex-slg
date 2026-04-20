import { createContext, useContext, useState, type ReactNode } from "react";
import type { Customer } from "@/data/mock-data";
import type { IngestResult, ApprovalRequest, ApprovalComment } from "@/data/ingest-data";
import { seedApprovalComments } from "@/data/ingest-data";

interface IngestContextValue {
  // Which sample was chosen for the current ingest session
  selectedSample: "sample1" | "sample2" | null;
  setSelectedSample: (s: "sample1" | "sample2" | null) => void;

  // Session-created objects (cleared on refresh)
  sessionCustomers: Customer[];
  addSessionCustomer: (c: Customer) => void;
  sessionProductSkus: string[];
  addSessionProductSku: (sku: string) => void;

  // Completed ingest result
  ingestResult: IngestResult | null;
  setIngestResult: (r: IngestResult | null) => void;

  // Approval requests
  approvalRequests: ApprovalRequest[];
  addApprovalRequest: (r: ApprovalRequest) => void;
  updateApprovalStatus: (id: string, status: ApprovalRequest["status"]) => void;
  addApprovalComment: (approvalId: string, comment: ApprovalComment) => void;

  // Submitted invoice IDs (for "Send for Approval" CTA state)
  submittedInvoiceIds: Set<string>;
  submitInvoiceForApproval: (invoiceId: string) => void;

  // Invoice status overrides (Approved / Cancelled)
  invoiceStatusOverrides: Record<string, string>;
  setInvoiceStatusOverride: (invoiceId: string, status: string) => void;
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

  function submitInvoiceForApproval(invoiceId: string) {
    setSubmittedInvoiceIds((prev) => new Set([...prev, invoiceId]));
    // Create an approval request with seed comments
    const approvalId = `APR-${invoiceId}`;
    const existing = approvalRequests.find((r) => r.invoiceId === invoiceId);
    if (existing) return;
    const newRequest: ApprovalRequest = {
      id: approvalId,
      invoiceId,
      customerId: "",      // caller can update after
      customerName: "",    // caller can update after
      invoiceAmount: 0,    // caller can update after
      invoiceDate: new Date().toISOString().slice(0, 10),
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
      }}
    >
      {children}
    </IngestContext.Provider>
  );
}
