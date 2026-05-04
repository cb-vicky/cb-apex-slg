import { useEffect, useMemo, useState } from "react";
import { PanelRightOpen, CheckCircle2, Clock } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { contracts, customers } from "@/data/mock-data";
import type { ContractClosure, ClosureReason, ClosureSettlementType, Contract } from "@/data/mock-data";
import { patchFlowSession } from "@/store/drawer-store";
import { currency, shortDate, cn } from "@/lib/utils";
import { FieldSummaryPanel, type FieldSummaryItem } from "./ValidationPanel";
import { FormField, formInputClass, Select } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";

interface EarlyRenewalClosePriorStepProps {
  queueItemId: string;
}

const CLOSURE_REASONS: { id: ClosureReason; label: string }[] = [
  { id: "replaced_by_new", label: "Replaced by new contract" },
  { id: "customer_non_renewal", label: "Customer non-renewal" },
  { id: "mutual_agreement", label: "Mutual agreement" },
  { id: "ma_consolidation", label: "M&A consolidation" },
  { id: "non_payment", label: "Non-payment / Collections" },
  { id: "other", label: "Other" },
];

const SETTLEMENT_TYPES: { id: ClosureSettlementType; label: string }[] = [
  { id: "credit_note", label: "Credit note" },
  { id: "termination_charge", label: "Termination charge" },
  { id: "no_financial_impact", label: "No financial impact" },
];

function daysBetween(date1: string, date2: string): number {
  return Math.ceil((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24));
}

function ContractDocumentPreview({ contract, label }: { contract: Contract; label: string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border-default bg-white p-3">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-text-muted">{label}</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Contract ID", value: contract.id },
            { label: "Status", value: <StatusBadge status={contract.status} /> },
            { label: "Effective", value: shortDate(contract.effectiveDate) },
            { label: "Ends", value: shortDate(contract.endDate) },
            { label: "Term", value: contract.term },
              { label: "TCV", value: currency(contract.tcv) },
              { label: "Min commit", value: currency(contract.minAnnualCommit) },
          ].map((row) => (
            <div key={row.label} className="rounded-md border border-border-default bg-gray-50 px-2.5 py-2">
              <p className="text-[10px] uppercase tracking-wider text-text-muted">{row.label}</p>
              <p className="mt-0.5 text-[12px] font-semibold text-text-primary">{row.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClosurePriorPreviewPane({
  priorContract,
  newContract,
  onCollapse,
}: {
  priorContract: Contract;
  newContract?: Contract;
  onCollapse: () => void;
}) {
  const [tab, setTab] = useState<"new" | "prior">(newContract ? "new" : "prior");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default bg-white px-3 py-2">
        <div className="flex items-center gap-0.5 rounded-md border border-border-default bg-surface-muted p-0.5">
          {newContract && (
            <button
              type="button"
              onClick={() => setTab("new")}
              className={cn(
                "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
                tab === "new"
                  ? "bg-white text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary",
              )}
            >
              New contract
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("prior")}
            className={cn(
              "rounded px-2.5 py-1 text-[11px] font-medium transition-colors",
              tab === "prior"
                ? "bg-white text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            Prior contract
          </button>
        </div>
        <button
          type="button"
          onClick={onCollapse}
          className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          aria-label="Hide preview"
        >
          <PanelRightOpen size={14} className="rotate-180" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === "new" && newContract ? (
          <ContractDocumentPreview contract={newContract} label="Renewal contract" />
        ) : (
          <ContractDocumentPreview contract={priorContract} label="Prior contract (closing)" />
        )}
      </div>
    </div>
  );
}

export function EarlyRenewalClosePriorStep({ queueItemId }: EarlyRenewalClosePriorStepProps) {
  const {
    queueItems,
    sessionContracts,
    applyContractClosure,
    submitInvoiceForApproval,
    showClosureToast,
    pendingRenewalIngestions,
    applyQueueItemOverride,
    addSessionInvoice,
    approvalRequests,
    addApprovalComment,
    contractGraceExtensions,
    setContractGraceExtension,
  } = useIngestContext();

  const { setTrailingActions } = useUnifiedDrawerChrome();

  const q = queueItems.find((x) => x.id === queueItemId);
  const priorContract = q?.activeContractId ? contracts.find((c) => c.id === q.activeContractId) : undefined;
  const customer = q?.customerId ? customers.find((c) => c.id === q.customerId) : undefined;

  const pending = q?.activeContractId ? pendingRenewalIngestions[q.activeContractId] : undefined;
  const newContractId = pending?.pendingContractId;
  const newContract = newContractId
    ? sessionContracts.find((c) => c.id === newContractId) ?? contracts.find((c) => c.id === newContractId)
    : undefined;

  // Late renewal: detect if the prior contract has an active grace extension
  const graceExtension = priorContract ? contractGraceExtensions[priorContract.id] : undefined;
  const isLateRenewal = q?.scenario === "Late Renewal";
  const showExtensionBanner = Boolean(graceExtension && !graceExtension.resolved);

  const today = new Date().toISOString().slice(0, 10);
  const [effectiveDate, setEffectiveDate] = useState(today);
  const [reason, setReason] = useState<ClosureReason>("replaced_by_new");
  const [settlementType, setSettlementType] = useState<ClosureSettlementType>(
    priorContract && priorContract.prepaidCreditBalance > 0 ? "credit_note" : "no_financial_impact"
  );
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const approval = useMemo(
    () => approvalRequests.find((r) => r.ingestId === queueItemId),
    [approvalRequests, queueItemId],
  );

  const calculations = useMemo(() => {
    if (!priorContract) return null;
    const termDays = daysBetween(priorContract.effectiveDate, priorContract.endDate);
    const elapsedDays = daysBetween(priorContract.effectiveDate, effectiveDate);
    const elapsedPct = Math.max(0, Math.min(100, Math.round((elapsedDays / termDays) * 100)));

    let suggestedAmount = 0;
    if (settlementType === "termination_charge") {
      suggestedAmount = Math.round(priorContract.minAnnualCommit * (1 - elapsedPct / 100));
    } else if (settlementType === "credit_note") {
      suggestedAmount = priorContract.prepaidCreditBalance;
    }
    return { elapsedPct, suggestedAmount };
  }, [priorContract, effectiveDate, settlementType]);

  const summaryItems: FieldSummaryItem[] = useMemo(() => {
    if (!priorContract || !calculations) return [];
    return [
      { id: "contract", label: "Prior contract", value: priorContract.id },
      { id: "tcv", label: "TCV", value: currency(priorContract.tcv) },
      { id: "elapsed", label: "Term elapsed", value: `${calculations.elapsedPct}%` },
      { id: "effective", label: "Closure date", value: shortDate(effectiveDate), status: "edited" },
      { id: "reason", label: "Reason", value: CLOSURE_REASONS.find((r) => r.id === reason)?.label ?? reason },
      { id: "settlement", label: "Settlement", value: SETTLEMENT_TYPES.find((s) => s.id === settlementType)?.label ?? settlementType },
      ...(calculations.suggestedAmount > 0
        ? [{ id: "amount", label: "Amount", value: currency(calculations.suggestedAmount), status: "computed" as const }]
        : []),
      ...(newContract
        ? [{ id: "renewal", label: "New contract", value: newContract.id }]
        : []),
    ];
  }, [priorContract, calculations, effectiveDate, reason, settlementType, newContract]);

  function handleAddComment(text: string) {
    if (!approval) return;
    addApprovalComment(approval.id, {
      id: `qc-${Date.now()}`,
      author: "You",
      role: "Billing Ops",
      text,
      timestamp: new Date().toISOString(),
    });
  }

  function goBackToMap() {
    patchFlowSession({ step: "ingest", furthestUnlockedStep: "ingest", ingestReadOnly: false });
  }

  function advanceToInvoiceReview(invoiceId: string) {
    if (!q?.customerId) return;
    patchFlowSession({
      step: "invoice_review",
      furthestUnlockedStep: "invoice_review",
      invoiceId,
      queueItemId: q.id,
      contractId: q.contractId,
      customerId: q.customerId,
      ingestReadOnly: false,
    });
  }

  function handleConfirm() {
    if (!q || !priorContract || !customer || !calculations) return;

    const closure: ContractClosure = {
      effectiveDate,
      reason,
      settlementType,
      calculatedAmount: calculations.suggestedAmount,
      finalAmount: calculations.suggestedAmount,
      closedBy: "Alex Nguyen",
      closedAt: new Date().toISOString(),
      approvalRequired: true,
    };

    const timestamp = Date.now().toString().slice(-4);
    applyContractClosure(priorContract.id, closure);

    // Late renewal: mark the grace extension as resolved (prior contract is now closed)
    if (graceExtension) {
      setContractGraceExtension(priorContract.id, { ...graceExtension, resolved: true });
    }

    setConfirmed(true);

    const renewalInv = `INV-${isLateRenewal ? "LATE" : "EARLY"}-${timestamp}`;
    const renewalContractId =
      pending?.pendingContractId ?? (isLateRenewal ? "CON-2026-0NL1" : "CON-2026-0VH1");

    applyQueueItemOverride(q.id, {
      status: "Invoice review",
      contractId: renewalContractId,
      invoiceId: renewalInv,
      customerId: q.customerId,
    });

    const amt = pending?.renewalTcv ?? q.tcv;
    const invDate = new Date().toISOString().slice(0, 10);
    addSessionInvoice({
      id: renewalInv,
      customerId: customer.id,
      contractId: renewalContractId,
      date: invDate,
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
      amount: amt,
      status: "Pending Review",
      lineItems: [
        {
          description: isLateRenewal
            ? "Late renewal — first invoice (prototype)"
            : "Early renewal — first invoice (prototype)",
          amount: amt,
        },
      ],
      owner: "Alex Nguyen",
    });

    submitInvoiceForApproval(renewalInv, {
      customerId: customer.id,
      customerName: customer.name,
      invoiceAmount: pending?.renewalTcv ?? q.tcv,
      ingestId: q.id,
    });

    const settlementText =
      closure.settlementType === "credit_note"
        ? `Credit note for ${currency(closure.finalAmount)}`
        : closure.settlementType === "termination_charge"
          ? `Termination charge of ${currency(closure.finalAmount)}`
          : "No financial impact";
    showClosureToast(`Prior contract closed. ${settlementText}`, priorContract.id);

    setTimeout(() => advanceToInvoiceReview(renewalInv), 600);
  }

  useEffect(() => {
    if (confirmed) {
      setTrailingActions(null);
      return;
    }
    setTrailingActions(
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goBackToMap}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md bg-[color:var(--color-info)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Close & proceed
        </button>
      </div>,
    );
    return () => setTrailingActions(null);
  }, [confirmed, effectiveDate, reason, settlementType, q, priorContract, customer, calculations]);

  if (!q || !priorContract) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-[13px] text-text-muted">
        Queue item or prior contract not found.
      </div>
    );
  }

  const gridClass =
    "grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,25%)_minmax(0,35%)_minmax(0,40%)] [grid-template-rows:minmax(0,1fr)]";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <div className={gridClass}>
        <div className="min-h-0 max-h-full min-w-0 overflow-hidden border-r border-border-default bg-gray-50">
          <FieldSummaryPanel
            title="Closure summary"
            items={summaryItems}
            comments={approval?.comments ?? []}
            onSubmitComment={handleAddComment}
            commentsTitle="Discussion"
          />
        </div>

        <div className="min-h-0 max-h-full min-w-0 overflow-y-auto overscroll-y-contain border-r border-border-default">
          <div className="px-6 py-5 text-[14px] leading-snug">
            {confirmed ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <p className="text-[14px] font-medium text-emerald-700">Prior contract closed — proceeding to invoice review…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {showExtensionBanner && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <Clock size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-[13px] font-semibold text-amber-950">This customer has a contract in extension</p>
                        <p className="mt-0.5 text-[12px] text-amber-900">
                          Contract {priorContract.id} is in grace period through {shortDate(graceExtension!.until)} ·
                          billing {graceExtension!.billingMode === "continue" ? "continued" : "paused"}.
                          Closing this contract will resolve the grace extension.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3">
                  <p className="text-[13px] text-blue-900">
                    <span className="font-semibold text-blue-950">Close prior contract</span> before activating the renewal.
                  </p>
                </div>

                <FormField label="Effective date">
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className={formInputClass}
                  />
                </FormField>

                <FormField label="Closure reason">
                  <Select value={reason} onChange={(e) => setReason(e.target.value as ClosureReason)}>
                    {CLOSURE_REASONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                <FormField label="Settlement type">
                  <Select value={settlementType} onChange={(e) => setSettlementType(e.target.value as ClosureSettlementType)}>
                    {SETTLEMENT_TYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {calculations && calculations.suggestedAmount > 0 && (
                  <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
                    <p className="text-[12px] text-text-muted">
                      {settlementType === "credit_note" ? "Credit note amount" : "Termination charge"}
                    </p>
                    <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-text-primary">
                      {currency(calculations.suggestedAmount)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden border-l border-border-default">
          {!previewCollapsed ? (
            <ClosurePriorPreviewPane
              priorContract={priorContract}
              newContract={newContract}
              onCollapse={() => setPreviewCollapsed(true)}
            />
          ) : (
            <div className="flex min-h-0 flex-1 flex-row bg-gray-100">
              <div className="min-h-0 min-w-0 flex-1" aria-hidden />
              <div className="flex shrink-0 border-l border-border-default bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewCollapsed(false)}
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
    </div>
  );
}
