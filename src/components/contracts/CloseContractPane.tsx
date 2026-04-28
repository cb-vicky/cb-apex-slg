import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  X,
  AlertTriangle,
  Calendar,
  Info,
  FileText,
  CreditCard,
  DollarSign,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, shortDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/primitives";
import type { Contract, ContractClosure, ClosureReason, ClosureSettlementType } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLOSURE_REASONS: { id: ClosureReason; label: string; description: string }[] = [
  { id: "replaced_by_new", label: "Replaced by new contract", description: "Transitioning to a new agreement" },
  { id: "customer_non_renewal", label: "Customer non-renewal", description: "Customer chose not to renew the agreement" },
  { id: "mutual_agreement", label: "Mutual agreement", description: "Both parties agreed to end the contract early" },
  { id: "ma_consolidation", label: "M&A consolidation", description: "Merging or acquiring company consolidating vendors" },
  { id: "non_payment", label: "Non-payment / Collections", description: "Contract terminated due to payment issues" },
  { id: "other", label: "Other", description: "Specify reason in notes" },
];

const SETTLEMENT_TYPES: { id: ClosureSettlementType; label: string; description: string }[] = [
  { id: "credit_note", label: "Credit note", description: "Refund unused prepaid credits or prorated fees" },
  { id: "termination_charge", label: "Termination charge", description: "Settle remaining commitment or early-termination fee" },
  { id: "no_financial_impact", label: "No financial impact", description: "Mutual agreement with no settlement required" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysBetween(date1: string, date2: string): number {
  return Math.ceil((new Date(date2).getTime() - new Date(date1).getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface IncomingRenewalPreview {
  queueItemId: string;
  tcv: number;
  startDate: string;
  endDate: string;
  term: string;
  minCommit: number;
  prepaidCredits: number;
  products: { name: string; quantity: number; unitPrice: number; discount: number }[];
}

interface Props {
  contract: Contract;
  onDiscard: () => void;
  onConfirm: (closure: ContractClosure) => void;
  incomingRenewal?: IncomingRenewalPreview;
  fromQueueItemId?: string;
}

// ---------------------------------------------------------------------------
// Right Pane — Contract Tab
// ---------------------------------------------------------------------------

function ContractTab({ contract }: { contract: Contract }) {
  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Contract", value: contract.id },
          { label: "Status", value: <StatusBadge status={contract.status} /> },
          { label: "Effective", value: shortDate(contract.effectiveDate) },
          { label: "Ends", value: shortDate(contract.endDate) },
          { label: "Term", value: contract.term },
          { label: "TCV", value: currency(contract.tcv) },
          { label: "Min annual commit", value: currency(contract.minAnnualCommit) },
          { label: "Prepaid balance", value: currency(contract.prepaidCreditBalance) },
        ].map((row) => (
          <div key={row.label} className="rounded-md border border-border-default bg-[#FAFAFA] px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{row.label}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-text-primary">{row.value}</p>
          </div>
        ))}
      </div>

      {contract.amendments.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            Amendments ({contract.amendments.length})
          </p>
          <div className="space-y-1.5">
            {contract.amendments.map((a) => (
              <div key={a.id} className="flex items-start justify-between rounded-md border border-border-subtle bg-white px-2.5 py-2">
                <div>
                  <p className="text-[12px] font-medium text-text-primary">{a.type}</p>
                  <p className="text-[11px] text-text-muted">{a.description} · {shortDate(a.effectiveDate)}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Products in force
        </p>
        <div className="space-y-1.5">
          {contract.products.map((p) => (
            <div key={p.sku} className="flex items-center justify-between rounded-md border border-border-subtle bg-white px-2.5 py-2">
              <div>
                <p className="text-[12px] font-medium text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-muted">{p.sku} · {p.billingCadence}</p>
              </div>
              {p.prepaidCredits > 0 && (
                <span className="text-[11px] font-medium text-blue-600">{currency(p.prepaidCredits)} prepaid</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right Pane — Last Invoice Tab
// ---------------------------------------------------------------------------

function LastInvoiceTab({ contract }: { contract: Contract }) {
  const allInvoices = getInvoices(contract.customerId).filter(
    (inv) => inv.contractId === contract.id
  );
  const lastInvoice = allInvoices.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  if (!lastInvoice) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-[13px] text-text-muted">
        No invoices found for this contract.
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Invoice", value: lastInvoice.id },
          { label: "Status", value: <StatusBadge status={lastInvoice.status} /> },
          { label: "Date", value: shortDate(lastInvoice.date) },
          { label: "Due", value: shortDate(lastInvoice.dueDate) },
          { label: "Amount", value: currency(lastInvoice.amount) },
          { label: "Contract", value: lastInvoice.contractId },
        ].map((row) => (
          <div key={row.label} className="rounded-md border border-border-default bg-[#FAFAFA] px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{row.label}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-text-primary">{row.value}</p>
          </div>
        ))}
      </div>

      {lastInvoice.lineItems.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Line items</p>
          <div className="divide-y divide-border-subtle overflow-hidden rounded-md border border-border-default">
            {lastInvoice.lineItems.map((li, i) => (
              <div key={i} className="flex items-center justify-between bg-white px-3 py-2">
                <p className="text-[12px] text-text-primary">{li.description}</p>
                <p className="tabular-nums text-[12px] font-medium text-text-primary">{currency(li.amount)}</p>
              </div>
            ))}
            <div className="flex items-center justify-between bg-[#FAFAFA] px-3 py-2">
              <p className="text-[12px] font-semibold text-text-primary">Total</p>
              <p className="tabular-nums text-[13px] font-semibold text-text-primary">{currency(lastInvoice.amount)}</p>
            </div>
          </div>
        </div>
      )}

      {lastInvoice.holdReason && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[12px] text-amber-800"><span className="font-medium">On hold:</span> {lastInvoice.holdReason}</p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right Pane — Incoming Renewal Tab
// ---------------------------------------------------------------------------

function IncomingRenewalTab({
  renewal,
  effectiveDate,
  settlementType,
  suggestedCreditAmount,
}: {
  renewal: IncomingRenewalPreview;
  effectiveDate: string;
  settlementType: ClosureSettlementType;
  suggestedCreditAmount: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isImmediate = effectiveDate <= today;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5">
        <Info size={13} className="mt-0.5 shrink-0 text-blue-600" />
        <div>
          <p className="text-[12px] font-medium text-blue-800">
            Renewal scheduled to activate on closure
          </p>
          <p className="mt-0.5 text-[11px] text-blue-700">
            From queue item {renewal.queueItemId} · TCV {currency(renewal.tcv)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Start date", value: shortDate(renewal.startDate) },
          { label: "End date", value: shortDate(renewal.endDate) },
          { label: "Term", value: renewal.term },
          { label: "TCV", value: currency(renewal.tcv) },
          { label: "Min commit", value: currency(renewal.minCommit) },
          { label: "Prepaid credits", value: renewal.prepaidCredits > 0 ? currency(renewal.prepaidCredits) : "None" },
        ].map((row) => (
          <div key={row.label} className="rounded-md border border-border-default bg-[#FAFAFA] px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{row.label}</p>
            <p className="mt-0.5 text-[12px] font-semibold text-text-primary">{row.value}</p>
          </div>
        ))}
      </div>

      {renewal.products.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Products</p>
          <div className="space-y-1.5">
            {renewal.products.map((p, i) => (
              <div key={i} className="flex items-center justify-between rounded-md border border-border-subtle bg-white px-2.5 py-2">
                <p className="text-[12px] font-medium text-text-primary">{p.name}</p>
                <p className="text-[11px] text-text-muted tabular-nums">
                  {p.quantity} × {currency(p.unitPrice)}{p.discount > 0 ? ` · ${p.discount}% off` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proration preview */}
      <div className="rounded-lg border border-border-default bg-white p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          Financial impact preview
        </p>
        {settlementType === "no_financial_impact" ? (
          <p className="text-[12px] text-text-muted">No financial settlement — contract closes with no charge or credit.</p>
        ) : isImmediate ? (
          <div className="space-y-1.5 text-[12px] text-text-secondary">
            <p>
              <span className="font-medium text-text-primary">Enforcement:</span> Immediate — renewal effective date aligns with closure date.
            </p>
            <p>
              <span className="font-medium text-text-primary">Proration:</span> Completes inside upcoming invoice for current period.
            </p>
            {settlementType === "credit_note" && suggestedCreditAmount > 0 && (
              <p>
                <span className="font-medium text-text-primary">Credits issued:</span> {currency(suggestedCreditAmount)} (unused prepaid balance).
              </p>
            )}
            {settlementType === "termination_charge" && suggestedCreditAmount > 0 && (
              <p>
                <span className="font-medium text-text-primary">One-time charge:</span> {currency(suggestedCreditAmount)} raised as termination invoice.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 text-[12px] text-text-secondary">
            <p>
              <span className="font-medium text-text-primary">Enforcement:</span> Deferred — renewal starts {shortDate(renewal.startDate)}.
            </p>
            <p>
              <span className="font-medium text-text-primary">Proration:</span> Applied to current month's invoice.
            </p>
            {settlementType === "credit_note" && suggestedCreditAmount > 0 && (
              <p>
                <span className="font-medium text-text-primary">Credits:</span> {currency(suggestedCreditAmount)} issued on {shortDate(effectiveDate)}.
              </p>
            )}
            {settlementType === "termination_charge" && suggestedCreditAmount > 0 && (
              <p>
                <span className="font-medium text-text-primary">One-time charge:</span> {currency(suggestedCreditAmount)} applies on {shortDate(effectiveDate)}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Discard confirmation inline banner
// ---------------------------------------------------------------------------

function DiscardConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 p-3">
      <p className="text-[12px] font-medium text-red-800">Discard closure?</p>
      <p className="mt-0.5 text-[11px] text-red-700">All inputs will be lost. The contract will remain Active.</p>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-red-500"
        >
          Yes, discard
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Keep editing
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CloseContractPane({
  contract,
  onDiscard,
  onConfirm,
  incomingRenewal,
  fromQueueItemId,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [effectiveDate, setEffectiveDate] = useState(today);
  const [reason, setReason] = useState<ClosureReason>(
    incomingRenewal ? "replaced_by_new" : "mutual_agreement"
  );
  const [reasonDetail, setReasonDetail] = useState("");
  const [settlementType, setSettlementType] = useState<ClosureSettlementType>(() => {
    if (incomingRenewal) {
      return contract.prepaidCreditBalance > 0 ? "credit_note" : "no_financial_impact";
    }
    return "credit_note";
  });
  const [overrideAmount, setOverrideAmount] = useState<number | null>(null);
  const [rightTab, setRightTab] = useState<"contract" | "last_invoice" | "renewal">(
    incomingRenewal ? "renewal" : "contract"
  );
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const calculations = useMemo(() => {
    const contractStart = contract.effectiveDate;
    const contractEnd = contract.endDate;
    const termDays = daysBetween(contractStart, contractEnd);
    const elapsedDays = daysBetween(contractStart, effectiveDate);
    const remainingDays = Math.max(0, termDays - elapsedDays);
    const elapsedPct = Math.max(0, Math.min(100, Math.round((elapsedDays / termDays) * 100)));

    let suggestedAmount = 0;
    let calculation = "";

    if (settlementType === "termination_charge") {
      const remainingCommit = Math.max(0, contract.minAnnualCommit - (contract.minAnnualCommit * elapsedPct / 100));
      suggestedAmount = Math.round(remainingCommit);
      calculation = `Remaining min-commit shortfall: ${currency(contract.minAnnualCommit)} × ${100 - elapsedPct}% = ${currency(suggestedAmount)}`;
    } else if (settlementType === "credit_note") {
      suggestedAmount = contract.prepaidCreditBalance;
      calculation = `Unused prepaid credit balance: ${currency(suggestedAmount)} (${contract.prepaidCreditBalance.toLocaleString()} of ${contract.prepaidCreditTotal.toLocaleString()} original)`;
    } else {
      suggestedAmount = 0;
      calculation = "No financial settlement required";
    }

    return {
      termDays,
      elapsedDays,
      remainingDays,
      elapsedPct,
      suggestedAmount,
      calculation,
      isBackdated: effectiveDate < today,
      isFutureDated: effectiveDate > today,
    };
  }, [contract, effectiveDate, settlementType, today]);

  const finalAmount = overrideAmount ?? calculations.suggestedAmount;

  const requiresApproval = true; // closures always route through approval
  const approvalReason =
    settlementType === "termination_charge"
      ? "Termination-generated invoice"
      : settlementType === "credit_note"
        ? "Closure credit note"
        : "Contract termination";

  // Auto-default settlement when reason changes to replaced_by_new
  function handleReasonChange(r: ClosureReason) {
    setReason(r);
    if (r === "replaced_by_new") {
      setSettlementType(contract.prepaidCreditBalance > 0 ? "credit_note" : "no_financial_impact");
    }
  }

  function handleConfirm() {
    const closure: ContractClosure = {
      effectiveDate,
      reason,
      reasonDetail: reasonDetail || undefined,
      settlementType,
      calculatedAmount: calculations.suggestedAmount,
      finalAmount,
      closedBy: "Alex Nguyen",
      closedAt: new Date().toISOString(),
      approvalRequired: requiresApproval,
      approvalReason: requiresApproval ? approvalReason : undefined,
    };
    onConfirm(closure);
  }

  const rightTabs = [
    { id: "contract" as const, label: "Contract" },
    { id: "last_invoice" as const, label: "Last Invoice" },
    ...(incomingRenewal ? [{ id: "renewal" as const, label: "Incoming Renewal" }] : []),
  ];

  const primaryCta = fromQueueItemId
    ? "Send for approval & proceed to ingest"
    : "Send for approval";

  // Breadcrumb segments
  const breadcrumbs = [
    { label: "Contracts", href: "/contracts" },
    { label: contract.id },
    { label: "Close Early" },
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Sticky Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border-default bg-white px-6 py-3">
          {/* Left side: Close button, heading, breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
              aria-label="Discard closure"
            >
              <X size={16} />
            </button>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Close contract early
              </h2>
              <nav className="flex items-center gap-1.5 text-[11px] text-text-muted">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-text-muted/50">/</span>}
                    {crumb.href ? (
                      <Link to={crumb.href} className="hover:text-text-secondary hover:underline">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={i === breadcrumbs.length - 1 ? "font-medium text-text-secondary" : ""}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            {fromQueueItemId && (
              <Link
                to={`/queue/${fromQueueItemId}`}
                className="ml-2 flex items-center gap-1 rounded-md border border-border-subtle bg-surface-muted px-2 py-1 text-[11px] text-text-muted transition-colors hover:border-border-default hover:text-blue-600"
              >
                <ArrowLeft size={11} />
                Queue {fromQueueItemId}
              </Link>
            )}
          </div>
          
          {/* Right side: Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5">
              <AlertTriangle size={12} className="text-amber-600" />
              <span className="text-[11px] font-medium text-amber-700">Requires approval</span>
            </div>
            <button
              type="button"
              onClick={() => setShowDiscardConfirm(true)}
              className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="rounded-md bg-[#012A38] px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#01374a]"
            >
              {primaryCta}
            </button>
          </div>
        </div>

        {/* Discard confirmation */}
        {showDiscardConfirm && (
          <DiscardConfirm
            onConfirm={onDiscard}
            onCancel={() => setShowDiscardConfirm(false)}
          />
        )}

        {/* Two-pane body: scrolling form | fixed preview panel */}
        <div className="flex min-h-0 flex-1">
          {/* LEFT — form inputs, scrolls, takes remaining space */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[720px] space-y-6 px-8 py-6">
            {/* Effective date */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Effective termination date
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full rounded-md border border-border-default bg-white py-2 pl-9 pr-3 text-[13px] text-text-primary outline-none transition-colors focus:border-cb-orange"
                />
              </div>
              {calculations.isBackdated && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-600">
                  <Info size={11} /> Backdated closure — may require additional approval
                </p>
              )}
              {calculations.isFutureDated && (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-blue-600">
                  <Info size={11} /> Future-dated — contract enters wind-down until {shortDate(effectiveDate)}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Reason for closure
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLOSURE_REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleReasonChange(r.id)}
                    className={cn(
                      "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                      reason === r.id
                        ? "border-cb-orange bg-cb-orange/5"
                        : "border-border-default bg-white hover:bg-surface-muted"
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                      reason === r.id ? "border-cb-orange bg-cb-orange" : "border-border-default bg-white"
                    )}>
                      {reason === r.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-text-primary">{r.label}</p>
                      <p className="mt-0.5 text-[10px] text-text-muted">{r.description}</p>
                    </div>
                  </button>
                ))}
              </div>
              {reason === "other" && (
                <textarea
                  value={reasonDetail}
                  onChange={(e) => setReasonDetail(e.target.value)}
                  placeholder="Describe the reason for closure..."
                  className="mt-2 w-full rounded-md border border-border-default bg-white p-3 text-[13px] text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-cb-orange"
                  rows={2}
                />
              )}
            </div>

            {/* Settlement type + Calculation — two column grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Settlement type */}
              <div>
                <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  Settlement type
                </label>
                <div className="space-y-2">
                  {SETTLEMENT_TYPES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSettlementType(s.id)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                        settlementType === s.id
                          ? "border-cb-orange bg-cb-orange/5"
                          : "border-border-default bg-white hover:bg-surface-muted"
                      )}
                    >
                      <span className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        settlementType === s.id ? "border-cb-orange bg-cb-orange" : "border-border-default bg-white"
                      )}>
                        {settlementType === s.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <div>
                        <p className="text-[12px] font-medium text-text-primary">{s.label}</p>
                        <p className="mt-0.5 text-[10px] text-text-muted">{s.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated impact */}
              {settlementType !== "no_financial_impact" ? (
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    {settlementType === "termination_charge" ? "Termination charge" : "Credit note"} calculation
                  </label>
                  <div className="rounded-lg border border-border-default bg-[#FAFAFA] p-3">
                    <div className="mb-2 flex items-start gap-2">
                      {settlementType === "credit_note"
                        ? <CreditCard size={13} className="mt-0.5 shrink-0 text-text-muted" />
                        : <DollarSign size={13} className="mt-0.5 shrink-0 text-text-muted" />
                      }
                      <p className="text-[11px] text-text-muted">{calculations.calculation}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-2 text-[12px]">
                      <div>
                        <p className="text-[10px] text-text-muted">Elapsed</p>
                        <p className="font-medium text-text-primary">{calculations.elapsedDays}d ({calculations.elapsedPct}%)</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted">Remaining</p>
                        <p className="font-medium text-text-primary">{calculations.remainingDays}d</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] text-text-muted">Suggested amount</p>
                        <p className="text-[18px] font-semibold tabular-nums text-text-primary">{currency(calculations.suggestedAmount)}</p>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-border-subtle pt-3">
                      <label className="mb-1 block text-[10px] text-text-muted">
                        Final amount (override if needed)
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-text-muted">$</span>
                        <input
                          type="number"
                          value={overrideAmount ?? calculations.suggestedAmount}
                          onChange={(e) => setOverrideAmount(e.target.value ? Number(e.target.value) : null)}
                          className="w-full rounded-md border border-border-default bg-white py-1.5 pl-6 pr-3 text-[13px] font-medium tabular-nums text-text-primary outline-none transition-colors focus:border-cb-orange"
                        />
                      </div>
                      {overrideAmount !== null && overrideAmount !== calculations.suggestedAmount && (
                        <p className="mt-1 text-[10px] text-amber-600">
                          Differs from calculated by {currency(Math.abs(overrideAmount - calculations.suggestedAmount))}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* Approval badge */}
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-[12px] font-medium text-amber-800">
                  Requires approval — {approvalReason.toLowerCase()}
                </p>
                <p className="mt-0.5 text-[11px] text-amber-700">
                  {settlementType === "credit_note"
                    ? "The credit note will route through your approval workflow before being applied."
                    : settlementType === "termination_charge"
                      ? "The termination invoice will route through your approval workflow before sending."
                      : "The closure will be recorded and logged for audit."}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border-default bg-[#F7F7F8] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Summary</p>
              <ul className="space-y-1.5 text-[12px] text-text-primary">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-text-muted" />
                  Contract {contract.id} will {calculations.isFutureDated ? "enter wind-down and " : ""}close on <strong>{shortDate(effectiveDate)}</strong>
                </li>
                <li className="flex items-start gap-1.5">
                  <FileText size={12} className="mt-0.5 shrink-0 text-text-muted" />
                  Reason: <strong>{CLOSURE_REASONS.find((r) => r.id === reason)?.label}</strong>
                </li>
                {settlementType !== "no_financial_impact" && (
                  <li className="flex items-start gap-1.5">
                    {settlementType === "credit_note"
                      ? <CreditCard size={12} className="mt-0.5 shrink-0 text-text-muted" />
                      : <DollarSign size={12} className="mt-0.5 shrink-0 text-text-muted" />
                    }
                    Settlement: <strong>{settlementType === "credit_note" ? "Credit note" : "Termination charge"}</strong> of <strong>{currency(finalAmount)}</strong>
                  </li>
                )}
                {settlementType === "no_financial_impact" && (
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-text-muted" />
                    Settlement: <strong>No financial impact</strong>
                  </li>
                )}
                {incomingRenewal && (
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-blue-500" />
                    <span className="text-blue-700">
                      Renewal CON-2026-0VH1 will be scheduled upon approval
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* RIGHT — contract preview panel (fixed width like approval page) */}
        <div className="w-[440px] shrink-0 flex flex-col border-l border-border-default bg-[#F7F7F8]">
          {/* Tab bar */}
          <div className="flex shrink-0 items-center gap-1 border-b border-border-default bg-white px-4">
            {rightTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRightTab(tab.id)}
                className={cn(
                  "border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors",
                  rightTab === tab.id
                    ? "border-cb-orange text-text-primary"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                )}
              >
                {tab.label}
                {tab.id === "renewal" && (
                  <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">New</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab body — scrolls independently */}
          <div className="flex-1 overflow-y-auto">
            {rightTab === "contract" && <ContractTab contract={contract} />}
            {rightTab === "last_invoice" && <LastInvoiceTab contract={contract} />}
            {rightTab === "renewal" && incomingRenewal && (
              <IncomingRenewalTab
                renewal={incomingRenewal}
                effectiveDate={effectiveDate}
                settlementType={settlementType}
                suggestedCreditAmount={calculations.suggestedAmount}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
