import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, CheckCircle2, XCircle, PanelRightOpen, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge, KV } from "@/components/ui/primitives";
import { useScrolled } from "@/hooks/useScrolled";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { invoices, customers, contracts } from "@/data/mock-data";
import { verdantRenewalContractTemplate } from "@/data/mock-data";
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
import { ApprovalCommentsCard } from "@/components/approvals/approval-comments";
import { CriticalFieldsCard } from "@/components/approvals/approval-critical-fields-card";
import { DrawerRailIndent } from "@/components/transitions/DrawerSelectShell";
import type { ApprovalComment } from "@/data/ingest-data";

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
      <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
      <p className="text-[13px] font-medium text-emerald-700">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reject Reason Form
// ---------------------------------------------------------------------------

function RejectForm({
  onConfirm,
  onCancel,
  rejectPlaceholder = "Provide a reason for rejecting this invoice…",
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  rejectPlaceholder?: string;
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
        className="w-full resize-none rounded-lg border border-red-200 bg-white px-3 py-2 text-[12px] text-text-primary outline-none focus:border-red-400 placeholder:text-text-muted"
      />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className={cn(
            "rounded-md px-3 py-1.5 text-[12px] font-medium text-white transition-colors",
            reason.trim() ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-gray-300"
          )}>
          Confirm Rejection
        </button>
        <button type="button" onClick={onCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export function ApprovalDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const ingestId = searchParams.get("ingestId") ?? "";
  // Early renewal context: present when this approval is for a closure credit note/invoice
  const closureFor = searchParams.get("closureFor") ?? "";
  const closureQueueItemId = searchParams.get("queueItemId") ?? "";
  const navigate = useNavigate();
  const { ref: stickyRef, isScrolled } = useScrolled();
  const { persona } = useDemoPersona();
  const viewerIsApprover = persona === "approver";

  const {
    approvalRequests, updateApprovalStatus, addApprovalComment,
    setInvoiceStatusOverride, invoiceStatusOverrides,
    invoiceFieldOverrides, setInvoiceFieldOverride,
    firstApprovalCompletedFor, markFirstApprovalCompleted,
    approvalPolicy, setApprovalPolicy,
    pendingRenewalIngestions, clearPendingRenewalIngestion,
    addSessionContract,
    addSessionCustomer,
    applyQueueItemOverride,
    showRenewalToast,
    sessionContracts,
    sessionCustomers,
    sessionInvoices,
  } = useIngestContext();

  const [showToast, setShowToast] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [viewerCollapsed, setViewerCollapsed] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFinalSuccess, setShowFinalSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const docUi = useMemo(() => getApprovalDocUi(getApprovalDocKind(invoiceId)), [invoiceId]);

  const staticInvoice = invoices.find((i) => i.id === invoiceId);
  const sessionInvoice = invoiceId ? sessionInvoices.find((i) => i.id === invoiceId) : undefined;
  const approval = approvalRequests.find((r) => r.invoiceId === invoiceId);

  // For closure documents (CN-CLOSE-* or INV-TERM-*), build a synthetic invoice
  // from the approval request so the page can render
  const isClosureDocument = Boolean(
    invoiceId && (invoiceId.startsWith("CN-CLOSE-") || invoiceId.startsWith("INV-TERM-"))
  );
  const syntheticInvoice: Invoice | undefined = isClosureDocument && approval
    ? {
        id: approval.invoiceId,
        customerId: approval.customerId,
        contractId: closureFor,
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
    contracts.find((c) => c.id === effectiveInvoice?.contractId) ??
    (closureFor ? contracts.find((c) => c.id === closureFor) : undefined);
  const enrichment = invoiceId ? getInvoiceEnrichment(invoiceId) : undefined;
  const effectiveStatus = invoiceId ? (invoiceStatusOverrides[invoiceId] ?? effectiveInvoice?.status ?? "—") : "—";
  const overrides = invoiceId ? (invoiceFieldOverrides[invoiceId] ?? {}) : {};

  // Backdated detection — invoice date earlier than today
  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveInvoiceDate = overrides.invoiceDate ?? effectiveInvoice?.date ?? "";
  const isBackdated = effectiveInvoiceDate !== "" && effectiveInvoiceDate < todayIso;

  function handleAddComment(text: string) {
    if (!approval) return;
    const comment: ApprovalComment = {
      id: `ac-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text,
      timestamp: new Date().toISOString(),
    };
    addApprovalComment(approval.id, comment);
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

    // Early renewal auto-ingest: if this approval is for a closure document
    // and there's a pending renewal ingestion against the prior contract, create
    // the scheduled contract and mark the queue item as ingested.
    if (closureFor && closureQueueItemId && pendingRenewalIngestions[closureFor]) {
      const pending = pendingRenewalIngestions[closureFor];
      const closureEffectiveDate = effectiveInvoice?.date ?? todayIso;
      const newContract = {
        ...verdantRenewalContractTemplate,
        scheduledStartDate: closureEffectiveDate,
        replacesContractId: closureFor,
      };
      addSessionContract(newContract);
      applyQueueItemOverride(pending.queueItemId, {
        status: "Ingested",
        contractId: newContract.id,
      });
      clearPendingRenewalIngestion(closureFor);
      showRenewalToast(
        `Renewal ${newContract.id} scheduled to activate ${shortDate(closureEffectiveDate)} — prior contract closing.`,
        pending.customerId
      );
    }

    setToastMessage(docUi.toastSent);
    setShowToast(true);
  }

  function handleToastDone() {
    setShowToast(false);

    // If this was a closure approval for an early renewal, navigate to the
    // customer's contract tab (list view) to see both contracts.
    if (closureFor && closureQueueItemId && customer) {
      navigate(`/customers/${customer.id}?tab=contract`);
      return;
    }

    // Per spec: only trigger the merchant approval-policy modal on the FIRST
    // invoice approval within an ingestion cycle (URL carries ?ingestId=…).
    // Manual approvals from /approvals (no ingestId) just go to the invoice.
    if (ingestId && !firstApprovalCompletedFor[ingestId]) {
      markFirstApprovalCompleted(ingestId);
      setShowSettingsModal(true);
    } else {
      navigate(`/invoices/${invoiceId}?from=approvals`);
    }
  }

  function handleSavePolicy(policy: typeof approvalPolicy) {
    setApprovalPolicy(policy);
    setShowSettingsModal(false);
    setShowFinalSuccess(true);
  }

  function handleSkipPolicy() {
    setShowSettingsModal(false);
    setShowFinalSuccess(true);
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
    setTimeout(() => navigate("/approvals"), 1200);
  }

  if (!effectiveInvoice || !mergedCustomer) {
    return (
      <div className="flex flex-1 w-full flex-col items-center justify-center py-16 text-text-muted">
        <p className="text-[14px]">{docUi.notFoundMessage}</p>
        <button onClick={() => navigate("/approvals")}
          className="mt-3 text-[12px] text-blue-600 hover:underline">
          Back to Approvals
        </button>
      </div>
    );
  }

  const invoice = effectiveInvoice;
  const customer = mergedCustomer;

  // ── Final success state — replaces the whole page after policy save ────
  if (showFinalSuccess) {
    const policyLabel =
      approvalPolicy.mode === "auto-approve" ? "Auto-approve, always"
      : approvalPolicy.mode === "always-approve" ? "Send for approval, always"
      : approvalPolicy.mode === "non-standard" ? "Send for approval, only if non-standard"
      : "No policy set";
    return (
      <div className="flex flex-1 w-full flex-col">
        <div
          ref={stickyRef}
          className={cn(
            "sticky top-0 z-10 flex w-full items-center justify-between border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
            isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
          )}
        >
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <button onClick={() => navigate("/approvals")}
              className="text-text-secondary transition-colors hover:text-text-primary">
              Approvals
            </button>
            <ChevronRight size={11} className="text-text-muted/50" />
            <span className="font-medium text-text-primary">{invoice.id}</span>
            <span className="mx-2 text-text-muted/40">·</span>
            <span className="text-emerald-600 font-medium">Setup complete</span>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[640px] flex-col gap-5 px-6 py-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[18px] font-semibold text-text-primary">All set</p>
              <p className="text-[12px] text-text-muted">
                <span className="font-medium text-text-primary">{docUi.finalSuccessDocLabel}</span>{" "}
                <span className="font-medium text-text-primary">{invoice.id}</span>{" "}
                {docUi.finalSuccessVerb}{" "}
                <span className="font-medium text-text-primary">{customer.name}</span>
                {docUi.finalSuccessClosing}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border-default bg-surface-muted">
            <div className="border-b border-border-default px-4 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Summary</p>
            </div>
            <div className="divide-y divide-border-subtle px-4">
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">{docUi.summaryRowLabel}</p>
                <p className="text-[13px] font-medium text-text-primary">{invoice.id} · {currency(invoice.amount)}</p>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">Customer</p>
                <p className="text-[13px] font-medium text-text-primary">{customer.name}</p>
              </div>
              {contract && (
                <div className="flex items-center justify-between py-2.5">
                  <p className="text-[12px] text-text-muted">Contract</p>
                  <p className="text-[13px] font-medium text-text-primary">{contract.id}</p>
                </div>
              )}
              <div className="flex items-center justify-between py-2.5">
                <p className="text-[12px] text-text-muted">Approval policy</p>
                <p className="text-[13px] font-medium text-text-primary">{policyLabel}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/customers/${customer.id}?tab=customer`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#012A38] px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#01374a]"
            >
              View Customer
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate(`/invoices/${invoice.id}?from=approvals`)}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              {docUi.finalSuccessOpenDocLabel}
            </button>
            <button
              type="button"
              onClick={() => navigate("/queue")}
              className="ml-auto text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
            >
              Back to Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  const awaitingApproverDecision =
    approval != null &&
    approval.status === "Pending Approval" &&
    !approved &&
    !rejected;
  const canDecide = viewerIsApprover && awaitingApproverDecision;

  const formColumn = (
    <>
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
    </>
  );

  return (
    <div className="flex flex-1 w-full flex-col">
      {/* Sticky breadcrumb + CTAs */}
      <div
        ref={stickyRef}
        className={cn(
          "sticky top-0 z-10 flex w-full items-center gap-4 border-b border-[#F0F1F3] bg-white px-6 py-3 rounded-tl-[24px] transition-shadow duration-200",
          isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
        )}
      >
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-[12px] text-text-muted">
          <button onClick={() => navigate("/approvals")}
            className="text-text-secondary transition-colors hover:text-text-primary">
            Approvals
          </button>
          <ChevronRight size={11} className="text-text-muted/50" />
          <span className="truncate font-medium text-text-primary">{invoice.id}</span>
          <span className="mx-2 text-text-muted/40">·</span>
          <span className="truncate text-text-secondary">{customer.name}</span>
          <span className="mx-2 text-text-muted/40">·</span>
          <span className="shrink-0 font-medium text-text-primary">{currency(overrides.amount ?? invoice.amount)}</span>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={effectiveStatus} />
          {canDecide && (
            <>
              <div className="mx-1 h-5 w-px bg-border-default" />
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
      </div>

      {awaitingApproverDecision && !viewerIsApprover && (
        <div className="border-b border-amber-200/70 bg-amber-50 px-6 py-2 text-[12px] leading-snug text-amber-950">
          <span className="font-semibold">Operator view.</span> Switch to{" "}
          <span className="font-semibold">Approver</span> to approve or reject this document.
        </div>
      )}

      {/* Full-page shell: 25% fields · 25% comments · 50% document (preview column keeps width when collapsed). */}
      <div className="grid min-h-0 min-w-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-[minmax(0,25%)_minmax(0,25%)_minmax(0,50%)]">
        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-r border-border-default">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 text-[13px] leading-snug">{formColumn}</div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col border-r border-border-default bg-[#FAFAFA]">
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {approval ? (
              <ApprovalCommentsCard
                id="approval-comments"
                comments={approval.comments}
                onSubmitComment={handleAddComment}
                listMaxHeightClass="max-h-[calc(100vh-220px)]"
              />
            ) : (
              <div className="rounded-lg border border-dashed border-border-default bg-white px-4 py-8 text-center">
                <p className="text-[12px] leading-snug text-text-muted">
                  Comments appear here once an approval request exists for this document.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-l border-border-default">
          {!viewerCollapsed ? (
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
          ) : (
            <div className="flex min-h-0 flex-1 flex-row bg-[#EEF0F2]">
              <div className="min-h-0 min-w-0 flex-1" aria-hidden />
              <div className="flex shrink-0 border-l border-border-default bg-white">
                <button
                  type="button"
                  onClick={() => setViewerCollapsed(false)}
                  className="flex h-full min-h-[200px] w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                  title="Show preview"
                >
                  <PanelRightOpen size={14} />
                  <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Preview</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <Toast message={toastMessage} onDone={handleToastDone} />
      )}

      {showSettingsModal && (
        <ApprovalSettingsModal
          initial={approvalPolicy}
          onSave={handleSavePolicy}
          onSkip={handleSkipPolicy}
        />
      )}
    </div>
  );
}
