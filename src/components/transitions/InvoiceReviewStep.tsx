import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, ChevronRight, X, XCircle } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { invoices, customers, contracts } from "@/data/mock-data";
import type { Invoice } from "@/data/mock-data";
import { getInvoiceEnrichment } from "@/data/billing-data";
import { InvoicePDFTabContent, ContractPDFTabContent } from "@/components/approvals/approval-document-preview";
import { type FieldSummaryItem } from "@/components/transitions/ValidationPanel";
import { IngestWorkspaceTabs } from "@/components/transitions/IngestWorkspaceTabs";
import {
  approvalPreviewVariant,
  getApprovalDocKind,
  getApprovalDocUi,
} from "@/components/approvals/approval-doc-ui";
import { CriticalFieldsCard } from "@/components/approvals/approval-critical-fields-card";
import { DrawerRailIndent } from "@/components/transitions/DrawerSelectShell";
import { closeDrawer, patchFlowSession } from "@/store/drawer-store";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { activateScheduledContractAfterInvoiceApproval } from "@/data/zenith-ingest-session";
import { currency, cn, shortDate } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import type { ApprovalComment } from "@/data/ingest-data";

function RejectReasonForm({
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
    <div className="rounded-lg border border-red-200 bg-red-50/50 p-5">
      <p className="mb-3 text-[13px] font-medium text-red-700">Rejection reason</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={rejectPlaceholder}
        className="w-full resize-none rounded-md border border-red-200 bg-white px-3 py-2.5 text-[14px] leading-relaxed text-text-primary shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors placeholder:text-text-muted focus:border-red-400 focus:ring-2 focus:ring-red-100"
      />
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onConfirm(reason)}
          disabled={!reason.trim()}
          className={cn(
            "rounded-md px-4 py-2.5 text-[14px] font-medium text-white transition-colors",
            reason.trim() ? "bg-red-600 hover:bg-red-500" : "cursor-not-allowed bg-gray-300",
          )}
        >
          Confirm rejection
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border-default px-4 py-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-3.5 shadow-lg">
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      <p className="text-[14px] font-medium text-emerald-700">{message}</p>
    </div>
  );
}

export function InvoiceReviewStep({
  queueItemId,
  invoiceId,
  allContractsContent,
  showAllContracts,
  allContractsIsActive,
  onAllContractsTabClick,
  onAllContractsDeactivate,
  allContractsShowBack,
  onAllContractsBack,
}: {
  queueItemId: string;
  invoiceId: string;
  allContractsContent?: React.ReactNode;
  showAllContracts?: boolean;
  allContractsIsActive?: boolean;
  onAllContractsTabClick?: () => void;
  onAllContractsDeactivate?: () => void;
  allContractsShowBack?: boolean;
  onAllContractsBack?: () => void;
}) {
  const { persona } = useDemoPersona();
  const isApprover = persona === "approver";

  const {
    sessionInvoices,
    sessionCustomers,
    sessionContracts,
    submitInvoiceForApproval,
    setInvoiceStatusOverride,
    applyQueueItemOverride,
    invoiceFieldOverrides,
    setInvoiceFieldOverride,
    approvalRequests,
    addApprovalComment,
    ensureQueueIngestDiscussion,
    updateApprovalStatus,
    firstApprovalCompletedFor,
    markFirstApprovalCompleted,
    addSessionContract,
    addSessionCustomer,
    returnIngestToOperatorAfterReject,
    queueItems,
    pendingRenewalIngestions,
    contractGraceExtensions,
  } = useIngestContext();

  const { setTrailingActions } = useUnifiedDrawerChrome();

  const [sent, setSent] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [includeGraceCharges, setIncludeGraceCharges] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);

  const staticInvoice = invoices.find((i) => i.id === invoiceId);
  const sessionInvoice = sessionInvoices.find((i) => i.id === invoiceId);
  const invoice = sessionInvoice ?? staticInvoice;

  const mergedCustomer = useMemo(() => {
    if (!invoice) return undefined;
    return (
      sessionCustomers.find((c) => c.id === invoice.customerId) ??
      customers.find((c) => c.id === invoice.customerId)
    );
  }, [invoice, sessionCustomers]);

  const contract = useMemo(() => {
    if (!invoice) return undefined;
    
    const fromSession = sessionContracts.find((c) => c.id === invoice.contractId);
    if (fromSession) return fromSession;
    
    const fromStatic = contracts.find((c) => c.id === invoice.contractId);
    if (fromStatic) return fromStatic;
    
    const queueItem = queueItems.find((q) => q.id === queueItemId);
    if (queueItem?.contractId) {
      const queueContract = sessionContracts.find((c) => c.id === queueItem.contractId) ?? 
                            contracts.find((c) => c.id === queueItem.contractId);
      if (queueContract) return queueContract;
    }
    
    if (queueItem?.activeContractId) {
      const pending = pendingRenewalIngestions[queueItem.activeContractId];
      if (pending?.pendingContractId) {
        const pendingContract = sessionContracts.find((c) => c.id === pending.pendingContractId) ??
                                contracts.find((c) => c.id === pending.pendingContractId);
        if (pendingContract) return pendingContract;
      }
    }
    
    const latestSessionContract = sessionContracts.length > 0 
      ? sessionContracts[sessionContracts.length - 1]
      : undefined;
    return latestSessionContract;
  }, [invoice, sessionContracts, queueItems, queueItemId, pendingRenewalIngestions]);

  const approval = useMemo(() => {
    if (isApprover) {
      return approvalRequests.find((r) => r.invoiceId === invoiceId && r.status === "Pending Approval");
    }
    return approvalRequests.find((r) => r.ingestId === queueItemId);
  }, [approvalRequests, invoiceId, queueItemId, isApprover]);

  // Late renewal grace period info
  const graceInfo = useMemo(() => {
    const queueItem = queueItems.find((q) => q.id === queueItemId);
    if (!queueItem?.activeContractId) return null;
    const ext = contractGraceExtensions[queueItem.activeContractId];
    if (!ext) return null;
    const priorContract = contracts.find((c) => c.id === queueItem.activeContractId);
    if (!priorContract) return null;
    const endDate = new Date(priorContract.endDate);
    const graceEndDate = new Date(ext.until);
    const graceDays = Math.ceil((graceEndDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = priorContract.tcv / 365;
    const proratedAmount = Math.round(dailyRate * graceDays);
    return {
      graceDays,
      proratedAmount,
      billingMode: ext.billingMode,
      graceEndDate: ext.until,
      priorContractId: priorContract.id,
    };
  }, [queueItems, queueItemId, contractGraceExtensions]);

  useEffect(() => {
    if (isApprover || !mergedCustomer) return;
    ensureQueueIngestDiscussion(queueItemId, {
      customerId: mergedCustomer.id,
      customerName: mergedCustomer.name,
    });
  }, [ensureQueueIngestDiscussion, isApprover, mergedCustomer, queueItemId]);

  const processSummary = useMemo(() => {
    const queueItem = queueItems.find((q) => q.id === queueItemId);
    if (!queueItem) return undefined;
    if (queueItem.scenario === "Early Renewal") return "Early Renewal";
    if (queueItem.scenario === "Late Renewal") return "Late Renewal";
    if (queueItem.scenario === "New Business") return "New Deal";
    return undefined;
  }, [queueItems, queueItemId]);

  const docUi = useMemo(() => getApprovalDocUi(getApprovalDocKind(invoiceId)), [invoiceId]);
  const enrichment = getInvoiceEnrichment(invoiceId);
  const overrides = invoiceFieldOverrides[invoiceId] ?? {};

  const baseAmount = invoice?.amount ?? 0;
  const graceChargeAmount = includeGraceCharges && graceInfo ? graceInfo.proratedAmount : 0;
  const subtotalWithGrace = baseAmount + graceChargeAmount;
  const discountAmount = Math.round(subtotalWithGrace * (discountPercent / 100));
  const computedAmount = subtotalWithGrace - discountAmount;
  const taxRate = overrides.taxRate ?? 8;
  const taxAmount = Math.round(computedAmount * (taxRate / 100));
  const totalAmount = computedAmount + taxAmount;

  const fieldSummaryItems: FieldSummaryItem[] = useMemo(() => {
    if (!invoice) return [];
    const items: FieldSummaryItem[] = [
      { id: "subtotal", label: "Contract charges", value: currency(baseAmount), status: "computed" },
    ];
    if (includeGraceCharges && graceInfo) {
      items.push({
        id: "graceCharge",
        label: `Grace period (${graceInfo.graceDays} days)`,
        value: currency(graceChargeAmount),
        status: "edited",
      });
    }
    if (discountPercent > 0) {
      items.push({
        id: "discount",
        label: `Discount (${discountPercent}%)`,
        value: `-${currency(discountAmount)}`,
        status: "edited",
      });
    }
    items.push(
      { id: "tax", label: `Tax (${taxRate}%)`, value: currency(taxAmount), status: "computed" },
      { id: "total", label: "Total", value: currency(totalAmount), status: (discountPercent > 0 || includeGraceCharges) ? "edited" : "normal" },
    );
    const paymentTerms = overrides.paymentTerms ?? enrichment?.paymentTerms ?? "Net 30";
    const dueDate = overrides.dueDate ?? invoice.dueDate;
    items.push(
      { id: "terms", label: "Payment terms", value: paymentTerms },
      { id: "due", label: "Due date", value: shortDate(dueDate) },
    );
    if (overrides.poNumber || enrichment?.poNumber) {
      items.push({ id: "po", label: "PO number", value: overrides.poNumber ?? enrichment?.poNumber ?? "" });
    }
    return items;
  }, [invoice, baseAmount, discountPercent, discountAmount, taxRate, taxAmount, totalAmount, overrides, enrichment, includeGraceCharges, graceInfo, graceChargeAmount]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const effectiveInvoiceDate = overrides.invoiceDate ?? invoice?.date ?? "";
  const isBackdated = effectiveInvoiceDate !== "" && effectiveInvoiceDate < todayIso;

  function handleAddComment(text: string) {
    if (!approval) return;
    const tagged = text.includes("@") ? text : `${text} @Alex Nguyen`;
    const c: ApprovalComment = {
      id: `ac-op-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text: tagged,
      timestamp: new Date().toISOString(),
    };
    addApprovalComment(approval.id, c);
  }

  function confirmSendForApproval() {
    if (!invoice || !mergedCustomer) return;
    const finalAmount = includeGraceCharges && graceInfo
      ? (overrides.amount ?? invoice.amount) + graceInfo.proratedAmount
      : overrides.amount ?? invoice.amount;
    submitInvoiceForApproval(invoice.id, {
      customerId: mergedCustomer.id,
      customerName: mergedCustomer.name,
      invoiceAmount: finalAmount,
      invoiceDate: overrides.invoiceDate ?? invoice.date,
      ingestId: queueItemId,
    });
    setInvoiceStatusOverride(invoice.id, "Pending Approval");
    applyQueueItemOverride(queueItemId, { status: "Ingested" });
    setSent(true);
    setShowSendConfirmModal(false);
    setTimeout(() => closeDrawer(), 400);
  }

  function handleSendForApproval() {
    setShowSendConfirmModal(true);
  }

  function handleApprove() {
    if (!approval || !invoice) return;
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
    if (queueItemId && !firstApprovalCompletedFor[queueItemId]) {
      markFirstApprovalCompleted(queueItemId);
      patchFlowSession({ step: "approval_settings" });
      return;
    }
    closeDrawer();
  }

  function handleReject(reason: string) {
    if (!approval || !invoice) return;
    const note = reason.includes("@") ? reason : `${reason} @Alex Nguyen`;
    if (approval.ingestId) {
      returnIngestToOperatorAfterReject({
        queueItemId: approval.ingestId,
        invoiceId,
        contractId: contract?.id,
        returnReason: note,
      });
    } else {
      updateApprovalStatus(approval.id, "Rejected");
      setInvoiceStatusOverride(invoiceId, "Cancelled");
      addApprovalComment(approval.id, {
        id: `ac-rej-${Date.now()}`,
        author: "You",
        role: "Billing Ops",
        text: `${docUi.rejectCommentPrefix}. Reason: ${note}`,
        timestamp: new Date().toISOString(),
      });
    }
    setRejected(true);
    setRejectDialogOpen(false);
    setTimeout(() => closeDrawer(), 1200);
  }

  const sendRef = useRef(handleSendForApproval);
  const approveRef = useRef(handleApprove);
  useEffect(() => {
    sendRef.current = handleSendForApproval;
    approveRef.current = handleApprove;
  });

  const awaitingApproverDecision =
    isApprover && approval != null && approval.status === "Pending Approval" && !approved && !rejected;

  const overridesForInvoice = invoiceFieldOverrides[invoiceId];

  useEffect(() => {
    if (!invoice || !mergedCustomer) {
      setTrailingActions(null);
      return;
    }
    if (isApprover) {
      if (!awaitingApproverDecision) {
        setTrailingActions(null);
        return;
      }
      setTrailingActions(
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejectDialogOpen(true)}
            className="rounded-md border border-border-default bg-white px-4 py-2 text-[12px] font-semibold text-text-secondary shadow-sm transition-colors hover:bg-surface-muted"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => approveRef.current()}
            className="rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Approve
          </button>
        </div>,
      );
      return () => setTrailingActions(null);
    }
    if (sent) {
      setTrailingActions(null);
      return;
    }
    const amountLabel = currency(overridesForInvoice?.amount ?? invoice.amount);
    setTrailingActions(
      <button
        type="button"
        onClick={() => sendRef.current()}
        title={`Submits to approvers · ${amountLabel}`}
        className="inline-flex items-center gap-1 rounded-md bg-[color:var(--color-info)] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
      >
        Send for approval
        <ChevronRight size={14} className="opacity-90" aria-hidden />
      </button>,
    );
    return () => setTrailingActions(null);
  }, [
    invoice,
    mergedCustomer,
    isApprover,
    awaitingApproverDecision,
    sent,
    invoiceId,
    overridesForInvoice,
    setTrailingActions,
  ]);

  if (!invoice || !mergedCustomer) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12 text-[13px] text-text-muted">
        {docUi.notFoundMessage}
      </div>
    );
  }

  const inv: Invoice = invoice;
  const customer = mergedCustomer;

  if (isApprover) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
        {rejectDialogOpen && awaitingApproverDecision ? (
          <div
            className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-invoice-dialog-title"
            onClick={() => setRejectDialogOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-border-default bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <p id="reject-invoice-dialog-title" className="mb-3 text-[13px] font-semibold text-text-primary">
                Reject invoice
              </p>
              <RejectReasonForm
                onConfirm={handleReject}
                onCancel={() => setRejectDialogOpen(false)}
                rejectPlaceholder={docUi.rejectPlaceholder}
              />
            </div>
          </div>
        ) : null}
        <IngestWorkspaceTabs
          documentTabs={[
            ...(contract && customer
              ? [
                  {
                    id: "contract-pdf",
                    label: "New Contract",
                    content: <ContractPDFTabContent contract={contract} customer={customer} />,
                  },
                ]
              : []),
            {
              id: "invoice-pdf",
              label: "Invoice PDF",
              content: (
                <InvoicePDFTabContent
                  invoice={inv}
                  customer={customer}
                  enrichment={enrichment}
                  invoiceOverrides={overrides}
                  previewVariant={approvalPreviewVariant(getApprovalDocKind(invoiceId))}
                />
              ),
            },
          ]}
          firstTabLabel="Invoice details"
          summaryItems={fieldSummaryItems}
          extractedFieldsContent={
                <div className="bg-[#F3F4F6]" data-drawer-fields-container>
                  <div className="mx-auto max-w-[520px] px-6 py-5 text-[14px] leading-snug" data-drawer-fields-inner>
                    {approved && (
                      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <p className="text-[14px] font-medium text-emerald-700">{docUi.approvedBanner}</p>
                      </div>
                    )}
                    {rejected && (
                      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <XCircle size={16} className="text-gray-500" />
                        <p className="text-[14px] font-medium text-gray-600">{docUi.rejectedBanner}</p>
                      </div>
                    )}
                    <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                      <div className="border-b border-border-subtle px-5 py-3">
                        <h3 className="text-[14px] font-semibold text-text-primary">Invoice details</h3>
                      </div>
                      <div className="px-5 py-4">
                        <CriticalFieldsCard
                          layout="flat"
                          invoice={inv}
                          overrides={overrides}
                          onChange={(next) => setInvoiceFieldOverride(invoiceId, next)}
                          enrichmentBilling={
                            enrichment?.billingPeriodStart
                              ? { start: enrichment.billingPeriodStart, end: enrichment.billingPeriodEnd }
                              : undefined
                          }
                          enrichmentPaymentTerms={enrichment?.paymentTerms}
                          enrichmentPo={enrichment?.poNumber}
                          disabled
                          isBackdated={isBackdated}
                          amountFieldLabel={docUi.amountField}
                          dateFieldLabel={docUi.dateField}
                        />
                      </div>
                    </div>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-border-default bg-white">
                      <div className="border-b border-border-subtle px-5 py-3">
                        <h3 className="text-[14px] font-semibold text-text-primary">Context</h3>
                      </div>
                      <div className="px-5 py-4">
                        <DrawerRailIndent>
                          <div className="flex flex-col divide-y divide-border-subtle">
                            {contract ? (
                              <KV
                                label="Contract"
                                value={
                                  <span className="text-[13px] font-semibold leading-tight text-text-primary">
                                    <Link
                                      to={`/customers/${inv.customerId}?tab=contract&contractId=${contract.id}&from=approvals`}
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
              }
          comments={approval?.comments ?? []}
          onSubmitComment={handleAddComment}
          allContractsContent={allContractsContent}
          showAllContracts={showAllContracts}
          allContractsIsActive={allContractsIsActive}
          onAllContractsTabClick={onAllContractsTabClick}
          onAllContractsDeactivate={onAllContractsDeactivate}
          allContractsShowBack={allContractsShowBack}
          onAllContractsBack={onAllContractsBack}
          processSummary={processSummary}
        />

        {showToast && <Toast message={toastMessage} onDone={handleToastDone} />}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <IngestWorkspaceTabs
        documentTabs={[
          ...(contract && mergedCustomer
            ? [
                {
                  id: "contract-pdf",
                  label: "New Contract",
                  content: <ContractPDFTabContent contract={contract} customer={mergedCustomer} />,
                },
              ]
            : []),
          {
            id: "invoice-pdf",
            label: "Invoice PDF",
            content: (
              <InvoicePDFTabContent
                invoice={inv}
                customer={mergedCustomer}
                enrichment={enrichment}
                invoiceOverrides={overrides}
                previewVariant={approvalPreviewVariant(getApprovalDocKind(invoiceId))}
              />
            ),
          },
        ]}
        firstTabLabel="Invoice details"
        summaryItems={fieldSummaryItems}
        extractedFieldsContent={
              <div className="bg-[#F3F4F6]" data-drawer-fields-container>
                <div className="mx-auto max-w-[520px] px-6 py-5 text-[14px] leading-snug" data-drawer-fields-inner>
                  <div className="mb-4 rounded-2xl border border-cb-orange/40 bg-[#FFFCFA] px-4 py-3 text-[13px] text-text-secondary">
                    <span className="font-semibold text-text-primary">Review the generated invoice</span> before it is
                    submitted for approval. Fields below update the preview.
                  </div>
                  {graceInfo && !sent && (
                    <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3">
                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          checked={includeGraceCharges}
                          onChange={(e) => setIncludeGraceCharges(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-[13px] font-semibold text-blue-950">
                            Include prorated usage charges for grace period
                          </p>
                          <p className="mt-0.5 text-[12px] text-blue-900">
                            Add {currency(graceInfo.proratedAmount)} for {graceInfo.graceDays} days of grace period usage
                            (prior contract {graceInfo.priorContractId})
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                  {sent ? (
                    <p className="text-[14px] font-medium text-emerald-700">Sent for approval — closing…</p>
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                      <div className="border-b border-border-subtle px-5 py-3">
                        <h3 className="text-[14px] font-semibold text-text-primary">Invoice details</h3>
                      </div>
                      <div className="px-5 py-4">
                        <CriticalFieldsCard
                          layout="flat"
                          invoice={inv}
                          overrides={overrides}
                          onChange={(next) => setInvoiceFieldOverride(invoiceId, next)}
                          enrichmentBilling={
                            enrichment?.billingPeriodStart
                              ? { start: enrichment.billingPeriodStart, end: enrichment.billingPeriodEnd }
                              : undefined
                          }
                          enrichmentPaymentTerms={enrichment?.paymentTerms}
                          enrichmentPo={enrichment?.poNumber}
                          disabled={false}
                          isBackdated={
                            Boolean(
                              (overrides.invoiceDate ?? inv.date) &&
                                (overrides.invoiceDate ?? inv.date) < new Date().toISOString().slice(0, 10),
                            )
                          }
                          amountFieldLabel={docUi.amountField}
                          dateFieldLabel={docUi.dateField}
                          amountComputed
                          discountPercent={discountPercent}
                          onDiscountChange={setDiscountPercent}
                          showDiscountControl
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            }
        comments={approval?.comments ?? []}
        onSubmitComment={handleAddComment}
        allContractsContent={allContractsContent}
        showAllContracts={showAllContracts}
        allContractsIsActive={allContractsIsActive}
        onAllContractsTabClick={onAllContractsTabClick}
        onAllContractsDeactivate={onAllContractsDeactivate}
        allContractsShowBack={allContractsShowBack}
        onAllContractsBack={onAllContractsBack}
        processSummary={processSummary}
      />

      {showSendConfirmModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSendConfirmModal(false)} />
          <div className="relative z-10 w-[400px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                  <AlertCircle size={16} className="text-amber-600" />
                </div>
                <h2 className="text-[15px] font-semibold text-text-primary">Send for approval?</h2>
              </div>
              <button
                onClick={() => setShowSendConfirmModal(false)}
                className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-[13px] leading-relaxed text-text-secondary">
                This invoice will be routed to the approval queue for review before it can be sent to the customer.
              </p>
              <div className="mt-3 rounded-md border border-border-default bg-surface-muted px-3 py-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Invoice</span>
                  <span className="font-medium text-text-primary">{invoiceId}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Amount</span>
                  <span className="font-medium text-text-primary">{currency(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border-default px-5 py-3">
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(false)}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSendForApproval}
                className="rounded-md bg-[color:var(--color-info)] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Send for approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
