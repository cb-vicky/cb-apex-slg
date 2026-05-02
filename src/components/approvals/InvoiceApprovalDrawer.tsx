import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, PanelRightOpen, X, XCircle } from "lucide-react";
import { cn, currency, shortDate } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { invoices, customers, contracts } from "@/data/mock-data";
import { activateScheduledContractAfterInvoiceApproval } from "@/data/zenith-ingest-session";
import type { Invoice } from "@/data/mock-data";
import { getInvoiceEnrichment } from "@/data/billing-data";
import { ApprovalSettingsModal } from "@/components/approvals/ApprovalSettingsModal";
import { ApprovalDocumentPreviewPane } from "@/components/approvals/approval-document-preview";
import {
  approvalPreviewVariant,
  getApprovalDocKind,
  getApprovalDocUi,
} from "@/components/approvals/approval-doc-ui";
import { CriticalFieldsCard } from "@/components/approvals/approval-critical-fields-card";
import { DrawerRailIndent } from "@/components/transitions/DrawerSelectShell";

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
      <p className="text-[13px] font-medium text-emerald-700">{message}</p>
    </div>
  );
}

function RejectForm({
  onConfirm,
  onCancel,
  rejectPlaceholder,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  rejectPlaceholder: string;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-4">
      <p className="mb-2 text-[12px] font-semibold text-red-700">Rejection Reason</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={rejectPlaceholder}
        className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-red-400"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors",
            reason.trim() ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-gray-300",
          )}
        >
          Confirm Rejection
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export interface InvoiceApprovalDrawerProps {
  invoiceId: string;
  /** Queue item that produced this ingest-linked approval (optional). */
  queueItemId?: string;
  onClose: () => void;
}

export function InvoiceApprovalDrawer({ invoiceId, queueItemId, onClose }: InvoiceApprovalDrawerProps) {
  const navigate = useNavigate();
  const { persona } = useDemoPersona();
  const viewerIsApprover = persona === "approver";

  const {
    approvalRequests,
    updateApprovalStatus,
    addApprovalComment,
    setInvoiceStatusOverride,
    invoiceFieldOverrides,
    setInvoiceFieldOverride,
    firstApprovalCompletedFor,
    markFirstApprovalCompleted,
    approvalPolicy,
    setApprovalPolicy,
    sessionContracts,
    sessionInvoices,
    sessionCustomers,
    addSessionContract,
    addSessionCustomer,
  } = useIngestContext();

  const ingestId = queueItemId ?? "";

  const [showToast, setShowToast] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [viewerCollapsed, setViewerCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const docUi = useMemo(() => getApprovalDocUi(getApprovalDocKind(invoiceId)), [invoiceId]);

  const staticInvoice = invoices.find((i) => i.id === invoiceId);
  const sessionInvoice = sessionInvoices.find((i) => i.id === invoiceId);
  const approval = approvalRequests.find((r) => r.invoiceId === invoiceId);

  const isClosureDocument = Boolean(
    invoiceId && (invoiceId.startsWith("CN-CLOSE-") || invoiceId.startsWith("INV-TERM-")),
  );
  const syntheticInvoice: Invoice | undefined =
    isClosureDocument && approval
      ? {
          id: approval.invoiceId,
          customerId: approval.customerId,
          contractId: "",
          date: approval.invoiceDate,
          dueDate: approval.invoiceDate,
          amount: approval.invoiceAmount,
          status: approval.status === "Pending Approval" ? "Pending Approval" : "Approved",
          lineItems: [
            {
              description: invoiceId?.startsWith("CN-CLOSE-")
                ? "Contract closure — credit note for unused prepaid balance"
                : "Contract termination charge",
              amount: approval.invoiceAmount,
            },
          ],
          owner: "Alex Nguyen",
        }
      : undefined;

  const effectiveInvoice = sessionInvoice ?? staticInvoice ?? syntheticInvoice;
  const mergedCustomer =
    (effectiveInvoice &&
      (sessionCustomers.find((c) => c.id === effectiveInvoice.customerId) ??
        customers.find((c) => c.id === effectiveInvoice.customerId))) ??
    undefined;

  const contract =
    sessionContracts.find((c) => c.id === effectiveInvoice?.contractId) ??
    contracts.find((c) => c.id === effectiveInvoice?.contractId);

  const enrichment = invoiceId ? getInvoiceEnrichment(invoiceId) : undefined;
  const overrides = invoiceId ? (invoiceFieldOverrides[invoiceId] ?? {}) : {};

  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveInvoiceDate = overrides.invoiceDate ?? effectiveInvoice?.date ?? "";
  const isBackdated = effectiveInvoiceDate !== "" && effectiveInvoiceDate < todayIso;

  function handleOpenCommentsFullPage() {
    const params = new URLSearchParams();
    params.set("from", "approvals");
    if (ingestId) params.set("ingestId", ingestId);
    onClose();
    navigate(`/approvals/invoices/${invoiceId}?${params.toString()}`);
  }

  function handleApprove() {
    if (!approval || !invoiceId) return;
    updateApprovalStatus(approval.id, "Approved");
    const activated = activateScheduledContractAfterInvoiceApproval({
      invoiceId,
      invoiceAmount: approval.invoiceAmount,
      sessionContracts,
      sessionCustomers,
      seedCustomers: customers,
      addSessionContract,
      addSessionCustomer,
      setInvoicePaid: () => setInvoiceStatusOverride(invoiceId, "Paid"),
    });
    if (!activated) {
      setInvoiceStatusOverride(invoiceId, "Approved");
    }
    setApproved(true);
    setToastMessage(docUi.toastSent);
    setShowToast(true);
  }

  function handleToastDone() {
    setShowToast(false);
    if (ingestId && !firstApprovalCompletedFor[ingestId]) {
      markFirstApprovalCompleted(ingestId);
      setShowSettingsModal(true);
      return;
    }
    onClose();
  }

  function handleSavePolicy(policy: typeof approvalPolicy) {
    setApprovalPolicy(policy);
    setShowSettingsModal(false);
    onClose();
  }

  function handleSkipPolicy() {
    setShowSettingsModal(false);
    onClose();
  }

  function handleReject(reason: string) {
    if (!approval || !invoiceId) return;
    updateApprovalStatus(approval.id, "Rejected");
    setInvoiceStatusOverride(invoiceId, "Cancelled");
    setRejected(true);
    setShowRejectForm(false);
    addApprovalComment(approval.id, {
      id: `ac-rej-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text: `${docUi.rejectCommentPrefix}. Reason: ${reason}`,
      timestamp: new Date().toISOString(),
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  }

  if (!effectiveInvoice || !mergedCustomer) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-text-muted">
        <p className="text-[14px]">{docUi.notFoundMessage}</p>
        <button type="button" onClick={onClose} className="mt-3 text-[12px] text-blue-600 hover:underline">
          Close
        </button>
      </div>
    );
  }

  const invoice = effectiveInvoice;
  const customer = mergedCustomer;

  const awaitingApproverDecision =
    approval != null && approval.status === "Pending Approval" && !approved && !rejected;
  const canDecide = viewerIsApprover && awaitingApproverDecision;

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-white">
      <header className="sticky top-0 z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#F0F1F3] bg-white px-5 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close drawer"
          >
            <X size={18} />
          </button>
          <nav className="flex min-w-0 flex-wrap items-center gap-1 text-[12px] text-text-muted">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/approvals");
              }}
              className="text-text-secondary transition-colors hover:text-text-primary"
            >
              Approvals
            </button>
            <ChevronRight size={11} className="shrink-0 text-text-muted/50" />
            <span className="truncate font-medium text-text-primary">{invoice.id}</span>
            <span className="mx-1 text-text-muted/40">·</span>
            <span className="truncate text-text-secondary">{customer.name}</span>
          </nav>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {approval && (
            <button
              type="button"
              onClick={handleOpenCommentsFullPage}
              className="rounded-md border border-border-default bg-surface-muted px-3 py-1.5 text-[12px] font-medium text-text-secondary shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-100/90 hover:text-text-primary"
            >
              Open comments
            </button>
          )}
          {canDecide && (
            <>
              <button
                type="button"
                onClick={() => setShowRejectForm((v) => !v)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors",
                  showRejectForm
                    ? "border-neutral-300 bg-neutral-100 text-text-primary"
                    : "border-border-default bg-surface-muted text-text-secondary hover:bg-neutral-100/90 hover:text-text-primary",
                )}
              >
                Reject
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="rounded-md bg-[color:var(--color-info)] px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Approve
              </button>
            </>
          )}
        </div>
      </header>

      {awaitingApproverDecision && !viewerIsApprover && (
        <div className="border-b border-amber-200/70 bg-amber-50 px-5 py-2 text-[12px] leading-snug text-amber-950">
          <span className="font-semibold">Operator view.</span> Switch to <span className="font-semibold">Approver</span>{" "}
          to approve or reject this invoice.
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 w-full max-w-[min(100%,420px)] shrink-0 flex-col overflow-hidden border-r border-border-default sm:w-[420px] sm:min-w-[420px] sm:max-w-[420px]">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-snug">
            {showRejectForm && canDecide && (
              <div className="mb-4">
                <RejectForm
                  onConfirm={handleReject}
                  onCancel={() => setShowRejectForm(false)}
                  rejectPlaceholder={docUi.rejectPlaceholder}
                />
              </div>
            )}
            {approved && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                <p className="text-[12px] font-medium text-emerald-700">{docUi.approvedBanner}</p>
              </div>
            )}
            {rejected && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                <XCircle size={14} className="text-gray-500" />
                <p className="text-[12px] font-medium text-gray-600">{docUi.rejectedBanner}</p>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <CriticalFieldsCard
                layout="flat"
                invoice={invoice}
                overrides={overrides}
                onChange={(next) => invoiceId && setInvoiceFieldOverride(invoiceId, next)}
                enrichmentBilling={
                  enrichment?.billingPeriodStart
                    ? { start: enrichment.billingPeriodStart, end: enrichment.billingPeriodEnd }
                    : undefined
                }
                enrichmentPaymentTerms={enrichment?.paymentTerms}
                enrichmentPo={enrichment?.poNumber}
                disabled={!canDecide}
                isBackdated={isBackdated}
                amountFieldLabel={docUi.amountField}
                dateFieldLabel={docUi.dateField}
              />

              <div className="border-t border-border-default pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Context</p>
                <DrawerRailIndent className="mt-2">
                  <div className="flex flex-col divide-y divide-border-subtle">
                    {contract ? (
                      <KV
                        label="Contract"
                        value={
                          <span className="text-[13px] font-semibold leading-tight text-text-primary">
                            <Link
                              to={`/customers/${invoice.customerId}?tab=contract&contractId=${contract.id}&from=approvals`}
                              className="font-semibold text-[color:var(--color-info)] hover:underline"
                            >
                              {contract.id}
                            </Link>
                            <span className="font-medium text-text-secondary"> · {contract.term}</span>
                          </span>
                        }
                      />
                    ) : null}
                    {contract ? <KV label="TCV" value={currency(contract.tcv)} /> : null}
                    <KV label="Submitted by" value={approval?.submittedBy ?? "—"} />
                    <KV label="Submitted on" value={approval ? shortDate(approval.submittedAt) : "—"} />
                  </div>
                </DrawerRailIndent>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-l border-border-default md:flex",
            viewerCollapsed && "md:!hidden",
          )}
        >
          <ApprovalDocumentPreviewPane
            invoice={invoice}
            customer={customer}
            contract={contract}
            enrichment={enrichment}
            onCollapse={() => setViewerCollapsed(true)}
            invoiceOverrides={overrides}
            previewVariant={approvalPreviewVariant(getApprovalDocKind(invoiceId))}
            documentTabLabel={docUi.previewTab}
            emptyPreviewHint={docUi.emptyPreviewHint}
          />
        </div>

        {viewerCollapsed && (
          <div className="hidden shrink-0 border-l border-border-default md:block">
            <button
              type="button"
              onClick={() => setViewerCollapsed(false)}
              className="flex h-full w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Show preview"
            >
              <PanelRightOpen size={14} />
              <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Preview</span>
            </button>
          </div>
        )}
      </div>

      {showToast && <Toast message={toastMessage} onDone={handleToastDone} />}

      {showSettingsModal && (
        <ApprovalSettingsModal initial={approvalPolicy} onSave={handleSavePolicy} onSkip={handleSkipPolicy} />
      )}
    </div>
  );
}
