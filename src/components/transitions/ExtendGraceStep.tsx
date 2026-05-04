import { useEffect, useMemo, useState } from "react";
import { PanelRightOpen, CheckCircle2 } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { contracts, customers } from "@/data/mock-data";
import type { Contract } from "@/data/mock-data";
import { closeDrawer } from "@/store/drawer-store";
import { currency, shortDate } from "@/lib/utils";
import { FieldSummaryPanel, type FieldSummaryItem } from "./ValidationPanel";
import { FormField, formInputClass, Select } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";

interface ExtendGraceStepProps {
  queueItemId: string;
  contractId?: string;
}

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

export function ExtendGraceStep({ queueItemId, contractId }: ExtendGraceStepProps) {
  const {
    queueItems,
    sessionContracts,
    contractGraceExtensions,
    setContractGraceExtension,
    approvalRequests,
    addApprovalComment,
    applyQueueItemOverride,
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
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const approval = useMemo(
    () => approvalRequests.find((r) => r.ingestId === queueItemId),
    [approvalRequests, queueItemId],
  );

  const summaryItems: FieldSummaryItem[] = useMemo(() => {
    if (!contract) return [];
    const newEndDate = new Date(contract.endDate);
    newEndDate.setDate(newEndDate.getDate() + graceDays);

    return [
      { id: "contract", label: "Contract", value: contract.id },
      { id: "customer", label: "Customer", value: customer?.name ?? "—" },
      { id: "currentEnd", label: "Current end", value: shortDate(contract.endDate) },
      { id: "graceDays", label: "Grace days", value: `${graceDays} days`, status: "edited" },
      { id: "newEnd", label: "Extended to", value: shortDate(newEndDate.toISOString()), status: "computed" },
      { id: "billing", label: "Billing", value: graceBilling === "continue" ? "Continue" : "Paused", status: "edited" },
      { id: "tcv", label: "TCV", value: currency(contract.tcv) },
    ];
  }, [contract, customer, graceDays, graceBilling]);

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

  function handleConfirm() {
    if (!targetContractId || !contract) return;

    const newEndDate = new Date(contract.endDate);
    newEndDate.setDate(newEndDate.getDate() + graceDays);

    setContractGraceExtension(targetContractId, {
      contractId: targetContractId,
      customerId: contract.customerId,
      until: newEndDate.toISOString().slice(0, 10),
      billingMode: graceBilling,
      markedAt: new Date().toISOString(),
    });

    // Update queue item status to "Grace Extended" so it doesn't show in workbench
    // until the renewal contract becomes ingestable
    if (queueItemId) {
      applyQueueItemOverride(queueItemId, { status: "Grace Extended" });
    }

    setConfirmed(true);
    setTimeout(() => closeDrawer(), 600);
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
          onClick={handleCancel}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="rounded-md bg-[color:var(--color-info)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Extend grace
        </button>
      </div>,
    );
    return () => setTrailingActions(null);
  }, [confirmed, graceDays, graceBilling, targetContractId]);

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
            title="Extension summary"
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
                <p className="text-[14px] font-medium text-emerald-700">Grace period extended — closing…</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3">
                  <p className="text-[13px] text-amber-900">
                    <span className="font-semibold text-amber-950">Extend grace period</span> to keep the contract active past its end date while renewal is negotiated.
                  </p>
                </div>

                <FormField label="Grace duration (days)">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={graceDays}
                    onChange={(e) => setGraceDays(Math.max(1, Math.min(180, Number(e.target.value))))}
                    className={formInputClass}
                  />
                  <p className="mt-1 text-[11px] text-text-muted">
                    Extended end date: {shortDate(new Date(new Date(contract.endDate).getTime() + graceDays * 86400000).toISOString())}
                  </p>
                </FormField>

                <FormField label="Billing during grace">
                  <Select value={graceBilling} onChange={(e) => setGraceBilling(e.target.value as "continue" | "pause")}>
                    <option value="continue">Continue billing</option>
                    <option value="pause">Pause billing</option>
                  </Select>
                  <p className="mt-1 text-[11px] text-text-muted">
                    {graceBilling === "continue"
                      ? "Invoices will continue to generate during the grace period."
                      : "Billing will be paused until the grace period ends or renewal is confirmed."}
                  </p>
                </FormField>

                <div className="rounded-md border border-border-default bg-gray-50 px-4 py-3">
                  <p className="text-[12px] text-text-muted">Contract status</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status="Active" />
                    <span className="text-text-muted">→</span>
                    <StatusBadge status="Extended" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden border-l border-border-default">
          {!previewCollapsed ? (
            <ContractPreviewPane contract={contract} customerName={customer?.name ?? "Customer"} onCollapse={() => setPreviewCollapsed(true)} />
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
