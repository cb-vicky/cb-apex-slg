import { useEffect, useMemo, useState } from "react";
import { PanelRightOpen, CheckCircle2 } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { contracts, customers } from "@/data/mock-data";
import type { Contract, ContractClosure } from "@/data/mock-data";
import { closeDrawer } from "@/store/drawer-store";
import { currency, shortDate, cn } from "@/lib/utils";
import { FieldSummaryPanel, type FieldSummaryItem } from "./ValidationPanel";
import { FormField, formInputClass, Select } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";

interface ExtendGraceStepProps {
  queueItemId: string;
  contractId?: string;
}

type LateRenewalIntent = "extend_grace" | "schedule_renewal" | "cancel_contract";

const INTENT_OPTIONS: { value: LateRenewalIntent; label: string }[] = [
  { value: "extend_grace", label: "Extend grace period" },
  { value: "schedule_renewal", label: "Schedule renewal (same terms)" },
  { value: "cancel_contract", label: "Cancel contract on expiry" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function termToMonths(term: string): number {
  const m = term.match(/(\d+)\s*month/i);
  if (m) return Number(m[1]);
  const y = term.match(/(\d+)\s*year/i);
  if (y) return Number(y[1]) * 12;
  return 12;
}

// ---------------------------------------------------------------------------
// Inline toggle switch (no shared primitive in repo yet)
// ---------------------------------------------------------------------------

function ToggleSwitch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border-default bg-gray-50 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-text-primary">{label}</p>
        {description && (
          <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-[color:var(--color-info)]" : "bg-gray-300",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-[2px]",
          )}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contract Mock PDF body — used inside the right preview pane
// ---------------------------------------------------------------------------

function ContractDocumentBody({ contract, customerName }: { contract: Contract; customerName: string }) {
  return (
    <div className="space-y-5 font-mono text-[11px] leading-relaxed text-text-secondary">
      <div className="text-center">
        <p className="text-[13px] font-bold uppercase tracking-widest text-text-primary">
          Master Subscription Agreement
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

function ContractPreviewPane({
  contract,
  customerName,
  onCollapse,
}: {
  contract: Contract;
  customerName: string;
  onCollapse: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-gray-100">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-default bg-white px-3 py-2">
        <span className="rounded px-2.5 py-1 text-[11px] font-medium text-text-primary">
          Contract
        </span>
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
        <div className="mx-auto rounded-sm border border-border-default bg-white px-8 py-7 shadow-[0_2px_12px_rgba(17,24,39,0.08)]">
          <ContractDocumentBody contract={contract} customerName={customerName} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main step component
// ---------------------------------------------------------------------------

export function ExtendGraceStep({ queueItemId, contractId }: ExtendGraceStepProps) {
  const {
    queueItems,
    sessionContracts,
    contractGraceExtensions,
    setContractGraceExtension,
    approvalRequests,
    addApprovalComment,
    applyQueueItemOverride,
    applyContractClosure,
    showClosureToast,
    showRenewalToast,
  } = useIngestContext();

  const { setTrailingActions } = useUnifiedDrawerChrome();

  const q = queueItems.find((x) => x.id === queueItemId);
  const targetContractId = contractId ?? q?.contractId ?? q?.activeContractId;
  const contract = targetContractId
    ? sessionContracts.find((c) => c.id === targetContractId) ?? contracts.find((c) => c.id === targetContractId)
    : undefined;
  const customer = contract?.customerId
    ? customers.find((c) => c.id === contract.customerId)
    : undefined;

  const existingExtension = targetContractId ? contractGraceExtensions[targetContractId] : undefined;

  // ── Intent selector state ─────────────────────────────────────────────────
  const [intent, setIntent] = useState<LateRenewalIntent>(
    existingExtension ? "extend_grace" : "extend_grace",
  );

  // ── Extend grace state ────────────────────────────────────────────────────
  const initialGraceDays = useMemo(() => {
    if (!existingExtension || !contract) return 30;
    const extUntil = new Date(existingExtension.until);
    const endDate = new Date(contract.endDate);
    return Math.ceil((extUntil.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
  }, [existingExtension, contract]);

  const [graceDays, setGraceDays] = useState(initialGraceDays);
  const [graceBilling, setGraceBilling] = useState<"continue" | "pause">(
    existingExtension?.billingMode ?? "continue"
  );
  const [provisioningDuringGrace, setProvisioningDuringGrace] = useState<boolean>(
    existingExtension?.provisioningDuringGrace ?? true,
  );
  const [dunningDuringGrace, setDunningDuringGrace] = useState<boolean>(
    existingExtension?.dunningDuringGrace ?? true,
  );

  // ── Schedule renewal state (same terms) ───────────────────────────────────
  const renewalStart = contract ? addDaysIso(contract.endDate, 1) : "";
  const renewalEnd = contract ? addMonthsIso(renewalStart, termToMonths(contract.term)) : "";

  // ── Cancel contract state ─────────────────────────────────────────────────
  const [cancelEffectiveDate, setCancelEffectiveDate] = useState<string>(
    contract?.endDate ?? new Date().toISOString().slice(0, 10),
  );

  // ── Shared UI state ───────────────────────────────────────────────────────
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmedMessage, setConfirmedMessage] = useState("Grace period extended — closing…");

  const approval = useMemo(
    () => approvalRequests.find((r) => r.ingestId === queueItemId),
    [approvalRequests, queueItemId],
  );

  // ── Summary panel items per intent ────────────────────────────────────────
  const summaryItems: FieldSummaryItem[] = useMemo(() => {
    if (!contract) return [];

    const baseRows: FieldSummaryItem[] = [
      { id: "contract", label: "Contract", value: contract.id },
      { id: "customer", label: "Customer", value: customer?.name ?? "—" },
      { id: "currentEnd", label: "Current end", value: shortDate(contract.endDate) },
    ];

    if (intent === "extend_grace") {
      const newEndDate = addDaysIso(contract.endDate, graceDays);
      return [
        ...baseRows,
        { id: "graceDays", label: "Grace days", value: `${graceDays} days`, status: "edited" },
        { id: "newEnd", label: "Extended to", value: shortDate(newEndDate), status: "computed" },
        { id: "billing", label: "Billing", value: graceBilling === "continue" ? "Continue" : "Paused", status: "edited" },
        ...(graceBilling === "pause"
          ? [{ id: "prov", label: "Provisioning", value: provisioningDuringGrace ? "Active" : "Suspended", status: "edited" as const }]
          : [{ id: "dun", label: "Dunning", value: dunningDuringGrace ? "Continue" : "Paused", status: "edited" as const }]),
        { id: "tcv", label: "TCV", value: currency(contract.tcv) },
      ];
    }

    if (intent === "schedule_renewal") {
      return [
        ...baseRows,
        { id: "renewalTerm", label: "Renewal term", value: contract.term, status: "computed" },
        { id: "renewalStart", label: "Renewal start", value: shortDate(renewalStart), status: "computed" },
        { id: "renewalEnd", label: "Renewal end", value: shortDate(renewalEnd), status: "computed" },
        { id: "billing", label: "Billing", value: contract.billingFrequency },
        { id: "tcv", label: "Renewal TCV", value: currency(contract.tcv), status: "computed" },
      ];
    }

    // cancel_contract
    return [
      ...baseRows,
      { id: "closeOn", label: "Close on", value: shortDate(cancelEffectiveDate), status: "edited" },
      { id: "reason", label: "Reason", value: "Customer non-renewal" },
      { id: "settlement", label: "Settlement", value: "No financial impact" },
      { id: "tcv", label: "TCV", value: currency(contract.tcv) },
    ];
  }, [
    contract,
    customer,
    intent,
    graceDays,
    graceBilling,
    provisioningDuringGrace,
    dunningDuringGrace,
    renewalStart,
    renewalEnd,
    cancelEffectiveDate,
  ]);

  // ── Comment handler ───────────────────────────────────────────────────────
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

  function handleCancel() {
    closeDrawer();
  }

  // ── Confirm handlers per intent ───────────────────────────────────────────
  function handleConfirmExtendGrace() {
    if (!targetContractId || !contract) return;
    const newEndDate = addDaysIso(contract.endDate, graceDays);
    setContractGraceExtension(targetContractId, {
      contractId: targetContractId,
      customerId: contract.customerId,
      until: newEndDate,
      billingMode: graceBilling,
      ...(graceBilling === "pause" ? { provisioningDuringGrace } : {}),
      ...(graceBilling === "continue" ? { dunningDuringGrace } : {}),
      markedAt: new Date().toISOString(),
    });
    if (queueItemId) {
      applyQueueItemOverride(queueItemId, { status: "Grace Extended" });
    }
    setConfirmedMessage("Grace period extended — closing…");
    setConfirmed(true);
    setTimeout(() => closeDrawer(), 600);
  }

  function handleConfirmScheduleRenewal() {
    if (!targetContractId || !contract) return;
    showRenewalToast(
      `Renewal scheduled at same terms — starts ${shortDate(renewalStart)}.`,
      contract.customerId,
    );
    if (queueItemId) {
      applyQueueItemOverride(queueItemId, { status: "Grace Extended" });
    }
    setConfirmedMessage("Renewal scheduled — closing…");
    setConfirmed(true);
    setTimeout(() => closeDrawer(), 600);
  }

  function handleConfirmCancelContract() {
    if (!targetContractId || !contract) return;
    const closure: ContractClosure = {
      effectiveDate: cancelEffectiveDate,
      reason: "customer_non_renewal",
      settlementType: "no_financial_impact",
      calculatedAmount: 0,
      finalAmount: 0,
      closedBy: "Alex Nguyen",
      closedAt: new Date().toISOString(),
      approvalRequired: false,
    };
    applyContractClosure(targetContractId, closure);
    showClosureToast(
      `Contract scheduled to close on ${shortDate(cancelEffectiveDate)}.`,
      targetContractId,
    );
    if (queueItemId) {
      applyQueueItemOverride(queueItemId, { status: "Grace Extended" });
    }
    setConfirmedMessage("Cancellation scheduled — closing…");
    setConfirmed(true);
    setTimeout(() => closeDrawer(), 600);
  }

  // ── Trailing actions in stepper bar ───────────────────────────────────────
  useEffect(() => {
    if (confirmed) {
      setTrailingActions(null);
      return;
    }

    const ctaLabel =
      intent === "extend_grace"
        ? "Extend grace"
        : intent === "schedule_renewal"
          ? "Schedule renewal"
          : "Schedule cancellation";

    const onConfirm =
      intent === "extend_grace"
        ? handleConfirmExtendGrace
        : intent === "schedule_renewal"
          ? handleConfirmScheduleRenewal
          : handleConfirmCancelContract;

    setTrailingActions(
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-[color:var(--color-info)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {ctaLabel}
        </button>
      </div>,
    );
    return () => setTrailingActions(null);
  }, [
    confirmed,
    intent,
    graceDays,
    graceBilling,
    provisioningDuringGrace,
    dunningDuringGrace,
    cancelEffectiveDate,
    targetContractId,
  ]);

  if (!contract) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-[13px] text-text-muted">
        Contract not found.
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
            title={
              intent === "extend_grace"
                ? "Extension summary"
                : intent === "schedule_renewal"
                  ? "Renewal summary"
                  : "Cancellation summary"
            }
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
                <p className="text-[14px] font-medium text-emerald-700">{confirmedMessage}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Intent selector — what would you like to do? */}
                <FormField label="What would you like to do?">
                  <Select
                    value={intent}
                    onChange={(e) => setIntent(e.target.value as LateRenewalIntent)}
                  >
                    {INTENT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormField>

                {intent === "extend_grace" && (
                  <ExtendGraceBody
                    contract={contract}
                    graceDays={graceDays}
                    onGraceDaysChange={setGraceDays}
                    graceBilling={graceBilling}
                    onGraceBillingChange={setGraceBilling}
                    provisioningDuringGrace={provisioningDuringGrace}
                    onProvisioningChange={setProvisioningDuringGrace}
                    dunningDuringGrace={dunningDuringGrace}
                    onDunningChange={setDunningDuringGrace}
                  />
                )}

                {intent === "schedule_renewal" && (
                  <ScheduleRenewalBody
                    contract={contract}
                    renewalStart={renewalStart}
                    renewalEnd={renewalEnd}
                  />
                )}

                {intent === "cancel_contract" && (
                  <CancelContractBody
                    contract={contract}
                    cancelEffectiveDate={cancelEffectiveDate}
                    onCancelEffectiveDateChange={setCancelEffectiveDate}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden border-l border-border-default">
          {!previewCollapsed ? (
            <ContractPreviewPane
              contract={contract}
              customerName={customer?.name ?? "Customer"}
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

// ---------------------------------------------------------------------------
// Per-intent body components
// ---------------------------------------------------------------------------

function ExtendGraceBody({
  contract,
  graceDays,
  onGraceDaysChange,
  graceBilling,
  onGraceBillingChange,
  provisioningDuringGrace,
  onProvisioningChange,
  dunningDuringGrace,
  onDunningChange,
}: {
  contract: Contract;
  graceDays: number;
  onGraceDaysChange: (n: number) => void;
  graceBilling: "continue" | "pause";
  onGraceBillingChange: (v: "continue" | "pause") => void;
  provisioningDuringGrace: boolean;
  onProvisioningChange: (v: boolean) => void;
  dunningDuringGrace: boolean;
  onDunningChange: (v: boolean) => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
        <p className="text-[13px] text-amber-900">
          <span className="font-semibold text-amber-950">Extend grace period</span> to continue
          providing services past the contract end date while renewal is negotiated.
        </p>
      </div>

      <FormField label="Grace duration (days)">
        <input
          type="number"
          min={1}
          max={180}
          value={graceDays}
          onChange={(e) => onGraceDaysChange(Math.max(1, Math.min(180, Number(e.target.value))))}
          className={formInputClass}
        />
        <p className="mt-1 text-[11px] text-text-muted">
          Extended end date: {shortDate(addDaysIso(contract.endDate, graceDays))}
        </p>
      </FormField>

      <FormField label="Billing during grace">
        <Select
          value={graceBilling}
          onChange={(e) => onGraceBillingChange(e.target.value as "continue" | "pause")}
        >
          <option value="continue">Continue billing</option>
          <option value="pause">Pause billing</option>
        </Select>
        <p className="mt-1 text-[11px] text-text-muted">
          {graceBilling === "continue"
            ? "Invoices will continue to generate during the grace period."
            : "Billing will be paused until the grace period ends or renewal is confirmed."}
        </p>
      </FormField>

      {graceBilling === "pause" && (
        <ToggleSwitch
          label="Extend provisioning during grace"
          description="Keep services provisioned for the customer even though billing is paused."
          checked={provisioningDuringGrace}
          onChange={onProvisioningChange}
        />
      )}

      {graceBilling === "continue" && (
        <ToggleSwitch
          label="Continue dunning if invoices unpaid"
          description="Keep dunning workflows active for invoices that remain unpaid during grace."
          checked={dunningDuringGrace}
          onChange={onDunningChange}
        />
      )}

      <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
        <p className="text-[12px] text-text-muted">Contract status</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status="Active" />
          <span className="text-text-muted">→</span>
          <StatusBadge status="Extended" />
        </div>
      </div>
    </>
  );
}

function ScheduleRenewalBody({
  contract,
  renewalStart,
  renewalEnd,
}: {
  contract: Contract;
  renewalStart: string;
  renewalEnd: string;
}) {
  return (
    <>
      <div className="rounded-lg border border-blue-200 bg-blue-50/80 px-4 py-3">
        <p className="text-[13px] text-blue-900">
          <span className="font-semibold text-blue-950">Schedule renewal</span> at the same terms
          as the current contract. A new {contract.term} contract will start the day after the
          current one ends.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Renewal start">
          <input type="date" value={renewalStart} disabled className={formInputClass} />
        </FormField>
        <FormField label="Renewal end">
          <input type="date" value={renewalEnd} disabled className={formInputClass} />
        </FormField>
      </div>

      <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
        <p className="text-[12px] uppercase tracking-wider text-text-muted">Carried over</p>
        <div className="mt-2 grid grid-cols-2 gap-y-1 text-[12px]">
          <span className="text-text-muted">Term</span>
          <span className="text-right font-medium text-text-primary">{contract.term}</span>
          <span className="text-text-muted">Billing frequency</span>
          <span className="text-right font-medium text-text-primary">{contract.billingFrequency}</span>
          <span className="text-text-muted">Payment terms</span>
          <span className="text-right font-medium text-text-primary">{contract.paymentTerms}</span>
          <span className="text-text-muted">TCV</span>
          <span className="text-right font-medium text-text-primary">{currency(contract.tcv)}</span>
          <span className="text-text-muted">Min annual commit</span>
          <span className="text-right font-medium text-text-primary">{currency(contract.minAnnualCommit)}</span>
        </div>
      </div>

      <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
        <p className="text-[12px] text-text-muted">Contract status</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status="Active" />
          <span className="text-text-muted">→</span>
          <StatusBadge status="Scheduled" />
        </div>
      </div>
    </>
  );
}

function CancelContractBody({
  contract,
  cancelEffectiveDate,
  onCancelEffectiveDateChange,
}: {
  contract: Contract;
  cancelEffectiveDate: string;
  onCancelEffectiveDateChange: (v: string) => void;
}) {
  return (
    <>
      <div className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-3">
        <p className="text-[13px] text-red-900">
          <span className="font-semibold text-red-950">Cancel contract</span> on the contract
          expiry date. No grace period will apply and no renewal will be scheduled.
        </p>
      </div>

      <FormField
        label="Closure effective date"
        hint="Defaults to the contract expiry date. Backdate or forward-date as needed."
      >
        <input
          type="date"
          value={cancelEffectiveDate}
          onChange={(e) => onCancelEffectiveDateChange(e.target.value)}
          className={formInputClass}
        />
        <p className="mt-1 text-[11px] text-text-muted">
          Contract end date: {shortDate(contract.endDate)}
        </p>
      </FormField>

      <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
        <p className="text-[12px] uppercase tracking-wider text-text-muted">Closure summary</p>
        <div className="mt-2 grid grid-cols-2 gap-y-1 text-[12px]">
          <span className="text-text-muted">Reason</span>
          <span className="text-right font-medium text-text-primary">Customer non-renewal</span>
          <span className="text-text-muted">Settlement</span>
          <span className="text-right font-medium text-text-primary">No financial impact</span>
          <span className="text-text-muted">Open AR</span>
          <span className="text-right font-medium text-text-primary">{currency(contract.openAr)}</span>
        </div>
      </div>

      <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
        <p className="text-[12px] text-text-muted">Contract status</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status="Active" />
          <span className="text-text-muted">→</span>
          <StatusBadge status="Closing" />
        </div>
      </div>
    </>
  );
}
