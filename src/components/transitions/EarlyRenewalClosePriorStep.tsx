import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { contracts, customers } from "@/data/mock-data";
import type { ContractClosure, ClosureReason, ClosureSettlementType, Contract } from "@/data/mock-data";
import { patchFlowSession } from "@/store/drawer-store";
import { currency, shortDate, cn } from "@/lib/utils";
import { type FieldSummaryItem } from "./ValidationPanel";
import { IngestWorkspaceTabs } from "./IngestWorkspaceTabs";
import { FormField, formInputClass, Select } from "@/components/ui/form-field";

interface EarlyRenewalClosePriorStepProps {
  queueItemId: string;
  allContractsContent?: React.ReactNode;
  showAllContracts?: boolean;
  allContractsIsActive?: boolean;
  onAllContractsTabClick?: () => void;
  onAllContractsDeactivate?: () => void;
  allContractsShowBack?: boolean;
  onAllContractsBack?: () => void;
}

const CLOSURE_REASONS: { id: ClosureReason; label: string }[] = [
  { id: "replaced_by_new", label: "Replaced by new contract" },
  { id: "customer_non_renewal", label: "Customer non-renewal" },
  { id: "mutual_agreement", label: "Mutual agreement" },
  { id: "ma_consolidation", label: "M&A consolidation" },
  { id: "non_payment", label: "Non-payment / Collections" },
  { id: "other", label: "Other" },
];

const SETTLEMENT_TYPES_EARLY: { id: ClosureSettlementType; label: string }[] = [
  { id: "termination_charge", label: "Termination charge" },
  { id: "credit_note", label: "Credit note" },
  { id: "no_financial_impact", label: "No financial impact" },
];

/**
 * Late renewal almost always uses a one-time charge that is added to the renewal invoice
 * (vs. the early-renewal credit note). `termination_charge` is reused as the underlying type
 * but we relabel it for operator clarity.
 */
const SETTLEMENT_TYPES_LATE: { id: ClosureSettlementType; label: string }[] = [
  { id: "termination_charge", label: "One-time charge — added to renewal invoice" },
  { id: "no_financial_impact", label: "No financial impact" },
];

const TODAY_ISO = new Date().toISOString().slice(0, 10);

function daysBetween(date1: string, date2: string): number {
  return Math.ceil((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Contract Mock PDF body — same monospace agreement style used elsewhere.
// ---------------------------------------------------------------------------

function ContractDocumentBody({
  contract,
  customerName,
  variant,
}: {
  contract: Contract;
  customerName: string;
  variant: "prior" | "renewal";
}) {
  const heading =
    variant === "prior"
      ? "Master Subscription Agreement (Prior — closing)"
      : "Master Subscription Agreement (Renewal)";
  return (
    <div className="space-y-5 font-mono text-[11px] leading-relaxed text-text-secondary">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          {heading}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">Order Form</p>
        <p className="mt-0.5 text-[10px] text-text-muted">Contract ID: {contract.id}</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">PARTIES</p>
        <p className="mt-1">
          <span className="text-text-muted">Provider: </span>
          Chargebee US – Acme Merchant ("Provider")
        </p>
        <p className="mt-0.5">
          <span className="text-text-muted">Customer: </span>
          {customerName} ("Customer")
        </p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">1. TERM</p>
        <p className="mt-1">
          {contract.term} commencing {shortDate(contract.effectiveDate)} and ending {shortDate(contract.endDate)}.
        </p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">2. SUBSCRIPTION SERVICES</p>
        <table className="mt-2 w-full text-[10px]">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="pb-1 text-left font-semibold text-text-muted">Product / SKU</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Qty</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Unit Price</th>
              <th className="pb-1 text-right font-semibold text-text-muted">Disc</th>
            </tr>
          </thead>
          <tbody>
            {contract.products.map((p, i) => (
              <tr key={i} className="border-b border-border-subtle last:border-0">
                <td className="py-1 pr-2">
                  {p.name} <span className="text-text-muted">({p.sku})</span>
                </td>
                <td className="py-1 text-right tabular-nums">{p.quantity || "—"}</td>
                <td className="py-1 text-right tabular-nums">
                  {p.unitPrice < 1 ? `$${p.unitPrice.toFixed(3)}/cr` : `$${p.unitPrice.toLocaleString()}`}
                </td>
                <td className="py-1 text-right tabular-nums">
                  {p.discountApplied > 0 ? `${p.discountApplied}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">3. PRICING & COMMITMENT</p>
        <p className="mt-1">Total Contract Value (TCV): {currency(contract.tcv)}</p>
        <p>Minimum Annual Commit: {currency(contract.minAnnualCommit)}</p>
        {contract.prepaidCreditTotal > 0 && (
          <p>Prepaid Credits: {contract.prepaidCreditTotal.toLocaleString()} credits</p>
        )}
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">4. BILLING & PAYMENT</p>
        <p className="mt-1">Billing Frequency: {contract.billingFrequency}.</p>
        <p className="mt-0.5">Payment Terms: {contract.paymentTerms} from invoice date.</p>
      </div>

      <hr className="border-border-subtle" />

      <div>
        <p className="font-semibold text-text-primary">SIGNATURES</p>
        <div className="mt-2 grid grid-cols-2 gap-6">
          <div>
            <p className="text-text-muted">For Provider:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">Sarah Chen</p>
            <p className="text-text-muted">VP Revenue, Chargebee</p>
            <p className="mt-0.5 text-text-muted">Date: {shortDate(contract.signedDate)}</p>
          </div>
          <div>
            <p className="text-text-muted">For Customer:</p>
            <p className="mt-4 border-b border-border-default pb-1 font-semibold text-text-primary">
              Authorized Signatory
            </p>
            <p className="text-text-muted">{customerName}</p>
            <p className="mt-0.5 text-text-muted">Date: {shortDate(contract.signedDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculation card — collapsed shows the headline amount; expanded reveals the
// step-by-step proration logic with mock figures derived from the prior contract.
// ---------------------------------------------------------------------------

interface CalculationDetails {
  elapsedPct: number;
  remainingPct: number;
  elapsedDays: number;
  remainingDays: number;
  termDays: number;
  paidToDate: number;
  consumedToDate: number;
  dailyRate: number;
  remainingCommitment: number;
  suggestedAmount: number;
  oneTimeBreakdown: { gapDays: number; perDay: number } | null;
}

function CalcRow({ label, value, emphasis }: { label: string; value: React.ReactNode; emphasis?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1">
      <span className="text-[12px] text-text-muted">{label}</span>
      <span
        className={cn(
          "text-right text-[12px] tabular-nums",
          emphasis ? "font-semibold text-text-primary" : "text-text-primary",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CalculationCard({
  settlementType,
  isLateRenewal,
  expanded,
  onToggle,
  contract,
  calculations,
}: {
  settlementType: ClosureSettlementType;
  isLateRenewal: boolean;
  expanded: boolean;
  onToggle: () => void;
  contract: Contract;
  calculations: CalculationDetails;
}) {
  const isTermination = settlementType === "termination_charge";
  const headline = isLateRenewal && isTermination
    ? "Termination charge — added to renewal invoice"
    : isTermination
      ? "Termination charge"
      : settlementType === "credit_note"
        ? "Credit note amount"
        : "Settlement amount";

  const usedCredits = Math.max(0, contract.prepaidCreditTotal - contract.prepaidCreditBalance);
  const lateBreakdown = calculations.oneTimeBreakdown;

  return (
    <div className="rounded-md border border-border-default bg-gray-50">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-100"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-[12px] text-text-muted">{headline}</p>
          <p className="mt-0.5 text-[16px] font-semibold tabular-nums text-text-primary">
            {currency(calculations.suggestedAmount)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-[11px] font-medium text-text-secondary">
          <span>{expanded ? "Hide logic" : "View calculation"}</span>
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle bg-white px-4 py-3">
          {isTermination && isLateRenewal && lateBreakdown ? (
            <div className="flex flex-col">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Per-day proration · gap between prior end & renewal start
              </p>
              <CalcRow
                label="Prior contract end"
                value={shortDate(contract.endDate)}
              />
              <CalcRow
                label="Days elapsed since end"
                value={`${lateBreakdown.gapDays} days`}
              />
              <CalcRow
                label="Renewal contract per-day rate"
                value={`${currency(Math.round(lateBreakdown.perDay))}/day`}
              />
              <div className="my-2 rounded-md border border-dashed border-border-default bg-gray-50 px-3 py-2 font-mono text-[11px] text-text-secondary">
                {lateBreakdown.gapDays} days × {currency(Math.round(lateBreakdown.perDay))}/day
                <span className="mx-1.5 text-text-muted">→</span>
                <span className="font-semibold text-text-primary">
                  {currency(calculations.suggestedAmount)}
                </span>
              </div>
              <CalcRow
                label="Termination charge"
                value={currency(calculations.suggestedAmount)}
                emphasis
              />
            </div>
          ) : isTermination ? (
            <div className="flex flex-col">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Proration · remaining minimum commitment
              </p>
              <CalcRow
                label="Original term"
                value={`${shortDate(contract.effectiveDate)} → ${shortDate(contract.endDate)}`}
              />
              <CalcRow
                label="Term length"
                value={`${calculations.termDays} days`}
              />
              <CalcRow
                label="Elapsed at closure"
                value={`${calculations.elapsedDays} days · ${calculations.elapsedPct}%`}
              />
              <CalcRow
                label="Remaining at closure"
                value={`${calculations.remainingDays} days · ${calculations.remainingPct}%`}
              />
              <div className="my-2 h-px bg-border-subtle" />
              <CalcRow
                label="Min annual commitment"
                value={currency(contract.minAnnualCommit)}
              />
              <CalcRow
                label="Implied daily rate"
                value={`${currency(calculations.dailyRate)}/day`}
              />
              <CalcRow
                label="Paid by customer to date"
                value={currency(calculations.paidToDate)}
              />
              <CalcRow
                label="Consumed value (est.)"
                value={currency(calculations.consumedToDate)}
              />
              <div className="my-2 rounded-md border border-dashed border-border-default bg-gray-50 px-3 py-2 font-mono text-[11px] text-text-secondary">
                {currency(contract.minAnnualCommit)} × {calculations.remainingPct}% remaining
                <span className="mx-1.5 text-text-muted">→</span>
                <span className="font-semibold text-text-primary">
                  {currency(calculations.remainingCommitment)}
                </span>
              </div>
              <CalcRow
                label="Termination charge"
                value={currency(calculations.suggestedAmount)}
                emphasis
              />
              <p className="mt-2 text-[11px] leading-snug text-text-muted">
                Covers the unbilled portion of the prior commitment that the customer would
                otherwise owe through the original end date.
              </p>
            </div>
          ) : settlementType === "credit_note" ? (
            <div className="flex flex-col">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                Unused prepaid credit balance
              </p>
              <CalcRow
                label="Credits purchased"
                value={`${contract.prepaidCreditTotal.toLocaleString()} credits`}
              />
              <CalcRow
                label="Used to date"
                value={`${usedCredits.toLocaleString()} credits`}
              />
              <CalcRow
                label="Available balance"
                value={`${contract.prepaidCreditBalance.toLocaleString()} credits`}
              />
              <div className="my-2 rounded-md border border-dashed border-border-default bg-gray-50 px-3 py-2 font-mono text-[11px] text-text-secondary">
                Unused balance
                <span className="mx-1.5 text-text-muted">→</span>
                <span className="font-semibold text-text-primary">
                  {currency(calculations.suggestedAmount)}
                </span>
              </div>
              <CalcRow
                label="Credit note"
                value={currency(calculations.suggestedAmount)}
                emphasis
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

/**
 * Single contract PDF preview content for display within IngestWorkspaceTabs.
 */
function SingleContractPDFContent({
  contract,
  customerName,
  variant,
}: {
  contract: Contract;
  customerName: string;
  variant: "prior" | "renewal";
}) {
  return (
    <div className="flex min-h-full flex-col bg-[#F3F4F6]">
      {/* Document body */}
      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto max-w-3xl rounded-lg border border-border-default bg-white px-8 py-7 shadow-sm">
          <ContractDocumentBody contract={contract} customerName={customerName} variant={variant} />
        </div>
      </div>
    </div>
  );
}

export function EarlyRenewalClosePriorStep({ 
  queueItemId, 
  allContractsContent,
  showAllContracts,
  allContractsIsActive,
  onAllContractsTabClick,
  onAllContractsDeactivate,
  allContractsShowBack,
  onAllContractsBack,
}: EarlyRenewalClosePriorStepProps) {
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
  const settlementOptions = isLateRenewal ? SETTLEMENT_TYPES_LATE : SETTLEMENT_TYPES_EARLY;

  // Default closure date — Late renewal closes on the contract's expiry date so the renewal
  // can pick up immediately. Early renewal closes today (operator-driven).
  const defaultEffectiveDate = isLateRenewal && priorContract ? priorContract.endDate : TODAY_ISO;
  const [effectiveDate, setEffectiveDate] = useState(defaultEffectiveDate);
  const [reason, setReason] = useState<ClosureReason>(
    isLateRenewal ? "replaced_by_new" : "replaced_by_new",
  );
  // Termination charge is the default for both early and late renewals — credit note
  // is the exception and only fires when the operator explicitly selects it.
  const [settlementType, setSettlementType] = useState<ClosureSettlementType>("termination_charge");
  const [confirmed, setConfirmed] = useState(false);
  const [calcExpanded, setCalcExpanded] = useState(false);

  const approval = useMemo(
    () => approvalRequests.find((r) => r.ingestId === queueItemId),
    [approvalRequests, queueItemId],
  );

  const calculations = useMemo(() => {
    if (!priorContract) return null;
    const termDays = Math.max(1, daysBetween(priorContract.effectiveDate, priorContract.endDate));
    const elapsedDays = Math.max(0, daysBetween(priorContract.effectiveDate, effectiveDate));
    const remainingDays = Math.max(0, termDays - elapsedDays);
    const elapsedPct = Math.max(0, Math.min(100, Math.round((elapsedDays / termDays) * 100)));
    const remainingPct = Math.max(0, 100 - elapsedPct);

    // ── Mock paid / consumed figures derived from the billingSchedule ────────
    const paidToDate = priorContract.billingSchedule
      .filter((s) => s.status === "Paid")
      .reduce((sum, s) => sum + s.amount, 0);
    // Pretend the customer has consumed a proportion of their elapsed term.
    const consumedToDate = Math.round(priorContract.minAnnualCommit * (elapsedDays / 365));
    const dailyRate = Math.round(priorContract.minAnnualCommit / 365);
    const remainingCommitment = Math.round(priorContract.minAnnualCommit * (remainingPct / 100));

    let suggestedAmount = 0;
    let oneTimeBreakdown: { gapDays: number; perDay: number } | null = null;
    if (isLateRenewal && settlementType === "termination_charge" && newContract) {
      // Late renewal one-time charge = elapsed days between prior end and renewal start,
      // priced at the renewal contract per-day rate. Yearly billing → typically 0.
      const isMonthly = /month/i.test(newContract.billingFrequency);
      if (isMonthly) {
        const renewalStart = newContract.effectiveDate;
        const gapDays = Math.max(0, daysBetween(renewalStart, TODAY_ISO));
        const perDay = newContract.tcv / 365;
        suggestedAmount = Math.round(gapDays * perDay);
        oneTimeBreakdown = { gapDays, perDay };
      } else {
        suggestedAmount = 0;
        oneTimeBreakdown = { gapDays: 0, perDay: 0 };
      }
    } else if (settlementType === "termination_charge") {
      suggestedAmount = remainingCommitment;
    } else if (settlementType === "credit_note") {
      suggestedAmount = priorContract.prepaidCreditBalance;
    }
    return {
      elapsedPct,
      remainingPct,
      elapsedDays,
      remainingDays,
      termDays,
      paidToDate,
      consumedToDate,
      dailyRate,
      remainingCommitment,
      suggestedAmount,
      oneTimeBreakdown,
    };
  }, [priorContract, effectiveDate, settlementType, isLateRenewal, newContract]);

  const isBackdated = effectiveDate < TODAY_ISO;
  const isForwardDated = effectiveDate > TODAY_ISO;

  const summaryItems: FieldSummaryItem[] = useMemo(() => {
    if (!priorContract || !calculations) return [];
    const settlementLabel =
      settlementOptions.find((s) => s.id === settlementType)?.label ?? settlementType;
    const amountLabel =
      settlementType === "termination_charge"
        ? isLateRenewal
          ? "Termination charge (added to renewal invoice)"
          : "Termination charge"
        : settlementType === "credit_note"
          ? "Credit note amount"
          : "Amount";
    return [
      { id: "contract", label: "Prior contract", value: priorContract.id },
      { id: "tcv", label: "TCV", value: currency(priorContract.tcv) },
      { id: "elapsed", label: "Term elapsed", value: `${calculations.elapsedPct}%` },
      {
        id: "effective",
        label: "Closure date",
        value: shortDate(effectiveDate),
        status: "edited",
      },
      { id: "reason", label: "Reason", value: CLOSURE_REASONS.find((r) => r.id === reason)?.label ?? reason },
      { id: "settlement", label: "Settlement", value: settlementLabel },
      ...(calculations.suggestedAmount > 0
        ? [
            {
              id: "amount",
              label: amountLabel,
              value: currency(calculations.suggestedAmount),
              status: "computed" as const,
            },
          ]
        : []),
      ...(newContract
        ? [{ id: "renewal", label: "New contract", value: newContract.id }]
        : []),
    ];
  }, [
    priorContract,
    calculations,
    effectiveDate,
    reason,
    settlementType,
    newContract,
    isLateRenewal,
    settlementOptions,
  ]);

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

    const baseAmt = pending?.renewalTcv ?? q.tcv;
    // Late renewal: add the one-time charge to the renewal invoice when settlement type is "termination_charge"
    const oneTimeCharge =
      isLateRenewal && settlementType === "termination_charge" ? calculations.suggestedAmount : 0;
    const amt = baseAmt + oneTimeCharge;
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
            ? "Late renewal — first invoice"
            : "Early renewal — first invoice",
          amount: baseAmt,
        },
        ...(oneTimeCharge > 0
          ? [
              {
                description: `One-time charge — elapsed days between prior contract end (${shortDate(priorContract.endDate)}) and renewal start (${shortDate(newContract?.effectiveDate ?? "")})`,
                amount: oneTimeCharge,
              },
            ]
          : []),
      ],
      owner: "Alex Nguyen",
    });

    submitInvoiceForApproval(renewalInv, {
      customerId: customer.id,
      customerName: customer.name,
      invoiceAmount: amt,
      ingestId: q.id,
    });

    const settlementText =
      closure.settlementType === "credit_note"
        ? `Credit note for ${currency(closure.finalAmount)}`
        : closure.settlementType === "termination_charge"
          ? isLateRenewal
            ? `One-time charge of ${currency(closure.finalAmount)} added to renewal invoice`
            : `Termination charge of ${currency(closure.finalAmount)}`
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

  const documentTabs = [
    ...(newContract
      ? [
          {
            id: "new-contract-pdf",
            label: "New Contract",
            content: (
              <SingleContractPDFContent
                contract={newContract}
                customerName={customer?.name ?? "Customer"}
                variant="renewal"
              />
            ),
          },
        ]
      : []),
    {
      id: "prior-contract-pdf",
      label: "Prior Contract PDF",
      content: (
        <SingleContractPDFContent
          contract={priorContract}
          customerName={customer?.name ?? "Customer"}
          variant="prior"
        />
      ),
    },
  ];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <IngestWorkspaceTabs
        documentTabs={documentTabs}
        firstTabLabel="Closure details"
        summaryItems={summaryItems}
        extractedFieldsContent={
              <div className="bg-[#F3F4F6]" data-drawer-fields-container>
                <div className="mx-auto max-w-[520px] px-6 py-5 text-[14px] leading-snug" data-drawer-fields-inner>
                  {confirmed ? (
                    <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <p className="text-[14px] font-medium text-emerald-700">Prior contract closed — proceeding to invoice review…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {showExtensionBanner && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3">
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

                      <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3">
                        <p className="text-[13px] text-blue-900">
                          <span className="font-semibold text-blue-950">Close prior contract</span>{" "}
                          {isLateRenewal
                            ? "on the contract expiry date so the renewal can pick up. Backdate or forward-date as needed."
                            : "before activating the renewal."}
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                        <div className="border-b border-border-subtle px-5 py-3">
                          <h3 className="text-[14px] font-semibold text-text-primary">Closure details</h3>
                        </div>
                        <div className="flex flex-col gap-4 px-5 py-4">
                          <FormField
                            label="Closure effective date"
                            hint={
                              isLateRenewal
                                ? "Defaults to the prior contract's expiry date. Operators commonly backdate to align with the renewal start."
                                : undefined
                            }
                          >
                            <input
                              type="date"
                              value={effectiveDate}
                              onChange={(e) => setEffectiveDate(e.target.value)}
                              className={formInputClass}
                            />
                            {isBackdated ? (
                              <p className="mt-1 text-[11px] text-amber-700">
                                Backdated to {shortDate(effectiveDate)}.
                              </p>
                            ) : isForwardDated ? (
                              <p className="mt-1 text-[11px] text-text-muted">
                                Scheduled for {shortDate(effectiveDate)}.
                              </p>
                            ) : null}
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
                        </div>
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                        <div className="border-b border-border-subtle px-5 py-3">
                          <h3 className="text-[14px] font-semibold text-text-primary">Settlement</h3>
                        </div>
                        <div className="flex flex-col gap-4 px-5 py-4">
                          <FormField
                            label="Settlement type"
                            hint={
                              isLateRenewal
                                ? "For late renewals, any charge for the elapsed period is rolled into the upcoming renewal invoice."
                                : undefined
                            }
                          >
                            <Select value={settlementType} onChange={(e) => setSettlementType(e.target.value as ClosureSettlementType)}>
                              {settlementOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </Select>
                          </FormField>

                          {calculations && calculations.suggestedAmount > 0 && (
                            <CalculationCard
                              settlementType={settlementType}
                              isLateRenewal={isLateRenewal}
                              expanded={calcExpanded}
                              onToggle={() => setCalcExpanded((v) => !v)}
                              contract={priorContract}
                              calculations={calculations}
                            />
                          )}

                          {isLateRenewal && newContract && /year|annual/i.test(newContract.billingFrequency) &&
                            settlementType === "termination_charge" && (
                              <div className="rounded-lg border border-border-subtle bg-gray-50 px-4 py-3 text-[12px] text-text-muted">
                                The renewal contract is billed annually upfront — the elapsed period is absorbed into the new annual invoice, so no extra one-time charge applies.
                              </div>
                            )}
                        </div>
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
        processSummary={isLateRenewal ? "Late Renewal" : "Early Renewal"}
      />
    </div>
  );
}
