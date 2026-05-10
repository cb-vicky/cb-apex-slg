import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Info, Building2, TrendingUp, FileText, PanelRightOpen } from "lucide-react";
import { cn, currency } from "@/lib/utils";
import { useIngestContext } from "@/context/IngestContext";
import { useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { customers, contracts, invoices } from "@/data/mock-data";
import type {
  ApprovalPolicyMode,
  NonStandardConditions,
} from "@/data/approval-policy";

interface ModeOption {
  id: ApprovalPolicyMode;
  title: string;
  subtitle: string;
  badge?: string;
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "auto-approve",
    title: "Auto-approve, always",
    subtitle:
      "Skip review for every invoice. Best for low-risk, well-controlled billing where every invoice has been pre-validated.",
  },
  {
    id: "always-approve",
    title: "Send for approval, always",
    subtitle:
      "Every invoice routes to an approver before sending. Highest control, recommended for enterprise or high-TCV customers.",
    badge: "Recommended for high-TCV",
  },
  {
    id: "non-standard",
    title: "Send for approval, only if non-standard",
    subtitle:
      "Standard invoices auto-send. Approval is required only when the invoice triggers one of your non-standard conditions.",
  },
];

const selectedOptionClass =
  "border-[color:var(--color-info)] bg-blue-50/80 ring-1 ring-[color:var(--color-info)]/20";
const selectedRadioClass = "border-[color:var(--color-info)] bg-[color:var(--color-info)]";

export function ApprovalSettingsStep({
  queueItemId,
  invoiceId,
  onComplete,
}: {
  queueItemId?: string;
  invoiceId?: string;
  onComplete?: () => void;
}) {
  const {
    approvalPolicy,
    setApprovalPolicy,
    sessionCustomers,
    sessionContracts,
    sessionInvoices,
    queueItems,
  } = useIngestContext();

  const { setTrailingActions } = useUnifiedDrawerChrome();

  const [mode, setMode] = useState<ApprovalPolicyMode>(approvalPolicy.mode ?? "auto-approve");
  const [conditions, setConditions] = useState<NonStandardConditions>(approvalPolicy.conditions);
  const [conditionsExpanded, setConditionsExpanded] = useState(true);
  const [saved, setSaved] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  const queueItem = queueItemId ? queueItems.find((q) => q.id === queueItemId) : undefined;

  const customer = useMemo(() => {
    const sessionInvoice = sessionInvoices.find((i) => i.id === invoiceId);
    const staticInvoice = invoices.find((i) => i.id === invoiceId);
    const inv = sessionInvoice ?? staticInvoice;
    if (inv) {
      return (
        sessionCustomers.find((c) => c.id === inv.customerId) ??
        customers.find((c) => c.id === inv.customerId)
      );
    }
    if (queueItem?.customerId) {
      return (
        sessionCustomers.find((c) => c.id === queueItem.customerId) ??
        customers.find((c) => c.id === queueItem.customerId)
      );
    }
    return undefined;
  }, [invoiceId, sessionInvoices, sessionCustomers, queueItem]);

  const contract = useMemo(() => {
    const sessionInvoice = sessionInvoices.find((i) => i.id === invoiceId);
    const staticInvoice = invoices.find((i) => i.id === invoiceId);
    const inv = sessionInvoice ?? staticInvoice;
    if (inv?.contractId) {
      return (
        sessionContracts.find((c) => c.id === inv.contractId) ??
        contracts.find((c) => c.id === inv.contractId)
      );
    }
    if (queueItem?.contractId) {
      return (
        sessionContracts.find((c) => c.id === queueItem.contractId) ??
        contracts.find((c) => c.id === queueItem.contractId)
      );
    }
    return sessionContracts.length > 0 ? sessionContracts[sessionContracts.length - 1] : undefined;
  }, [invoiceId, sessionInvoices, sessionContracts, queueItem]);

  const customerInvoiceCount = useMemo(() => {
    if (!customer) return 0;
    const staticCount = invoices.filter((i) => i.customerId === customer.id).length;
    const sessionCount = sessionInvoices.filter((i) => i.customerId === customer.id).length;
    return staticCount + sessionCount;
  }, [customer, sessionInvoices]);

  function toggle<K extends keyof NonStandardConditions>(key: K, value: NonStandardConditions[K]) {
    setConditions((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setApprovalPolicy({ mode, conditions });
    setSaved(true);
    onComplete?.();
  }

  function handleSkip() {
    onComplete?.();
  }

  // Trailing actions in stepper bar
  useEffect(() => {
    if (saved) {
      setTrailingActions(null);
      return;
    }

    setTrailingActions(
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="rounded-md border border-border-default px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-[color:var(--color-info)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          Save policy
        </button>
      </div>,
    );
    return () => setTrailingActions(null);
  }, [saved, mode, conditions]);

  const gridClass =
    "grid min-h-0 min-w-0 flex-1 grid-cols-[minmax(0,40%)_minmax(0,60%)] [grid-template-rows:minmax(0,1fr)]";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F3F4F6]">
      <div className={gridClass}>
        {/* Left: Customer context preview */}
        <div className="flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden">
          {!previewCollapsed ? (
            <div className="flex min-h-0 flex-1 flex-col bg-[#F3F4F6]">
              <div className="mx-4 mt-3 flex shrink-0 items-center justify-between gap-2 px-2 pb-2">
                <span className="rounded px-2.5 py-1 text-[11px] font-medium text-text-primary">
                  Customer Context
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewCollapsed(true)}
                  className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
                  aria-label="Hide preview"
                >
                  <PanelRightOpen size={14} className="rotate-180" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto p-4">
                {customer ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border-default bg-white p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                          <Building2 size={18} className="text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold text-text-primary">{customer.name}</p>
                          <p className="mt-0.5 text-[12px] text-text-muted">{customer.segment}</p>
                        </div>
                      </div>
                    </div>

                    {contract && (
                      <div className="rounded-2xl border border-border-default bg-white p-4">
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                          <FileText size={12} />
                          <span>Active contract</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-text-muted">Contract ID</span>
                            <span className="font-mono text-[12px] font-medium text-text-primary">
                              {contract.id}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-text-muted">TCV</span>
                            <span className="text-[12px] font-semibold text-text-primary">
                              {currency(contract.tcv)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] text-text-muted">Term</span>
                            <span className="text-[12px] text-text-primary">{contract.term}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-border-default bg-white p-4">
                      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                        <TrendingUp size={12} />
                        <span>Billing history</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-text-muted">Total invoices</span>
                          <span className="text-[12px] font-semibold text-text-primary">
                            {customerInvoiceCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[12px] text-text-muted">Payment history</span>
                          <span className="text-[12px] font-medium text-emerald-600">On-time</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                      <p className="text-[12px] leading-relaxed text-blue-900">
                        <span className="font-semibold">Recommendation:</span> For enterprise customers
                        with high TCV, consider "Send for approval, always" to maintain control over
                        billing communications.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border-default bg-white p-4">
                    <p className="text-[13px] text-text-muted">Customer context not available</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-row bg-[#F3F4F6]">
              <div className="flex shrink-0 bg-white">
                <button
                  type="button"
                  onClick={() => setPreviewCollapsed(false)}
                  className="flex h-full min-h-[200px] w-8 flex-col items-center justify-center gap-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                  title="Show context"
                >
                  <PanelRightOpen size={14} />
                  <span className="rotate-90 whitespace-nowrap text-[9px] uppercase tracking-widest">Context</span>
                </button>
              </div>
              <div className="min-h-0 min-w-0 flex-1" aria-hidden />
            </div>
          )}
        </div>

        {/* Right: Approval settings form */}
        <div className="relative flex min-h-0 max-h-full min-w-0 flex-col overflow-hidden bg-[#F3F4F6]">
          <div data-drawer-fields-container>
            <div className="mx-auto max-w-[520px] px-6 py-5 text-[14px] leading-snug" data-drawer-fields-inner>
              {saved ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle2 size={32} className="text-emerald-600" />
                  </div>
                  <p className="mt-4 text-[16px] font-semibold text-text-primary">Settings saved</p>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Approval policy has been configured for this customer.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                    <div className="border-b border-border-subtle px-5 py-3">
                      <h3 className="text-[14px] font-semibold text-text-primary">Approval routing</h3>
                      <p className="mt-0.5 text-[12px] text-text-muted">
                        Configure how future invoices should be routed
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 px-5 py-4">
                      {MODE_OPTIONS.map((opt) => {
                        const selected = mode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMode(opt.id)}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                              selected
                                ? selectedOptionClass
                                : "border-border-default bg-white hover:bg-surface-muted",
                            )}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                selected ? selectedRadioClass : "border-border-default bg-white",
                              )}
                            >
                              {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-[13px] font-semibold text-text-primary">
                                  {opt.title}
                                </p>
                                {opt.badge && (
                                  <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                                    {opt.badge}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[12px] leading-snug text-text-muted">
                                {opt.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {mode === "non-standard" && (
                    <div className="overflow-hidden rounded-2xl border border-border-default bg-white">
                      <button
                        type="button"
                        onClick={() => setConditionsExpanded(!conditionsExpanded)}
                        className="flex w-full items-center justify-between border-b border-border-subtle px-5 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <Info size={12} className="text-text-muted" />
                          <p className="text-[12px] font-semibold text-text-secondary">
                            Trigger approval when invoice is…
                          </p>
                        </div>
                        {conditionsExpanded ? (
                          <ChevronUp size={14} className="text-text-muted" />
                        ) : (
                          <ChevronDown size={14} className="text-text-muted" />
                        )}
                      </button>

                      {conditionsExpanded && (
                        <div className="space-y-3 px-5 py-4">
                          <ConditionRow
                            label="High TCV"
                            description="Total contract value exceeds threshold"
                            enabled={conditions.highTcv}
                            onToggle={(v) => toggle("highTcv", v)}
                          >
                            <ThresholdInput
                              prefix="$"
                              value={conditions.highTcvThreshold}
                              onChange={(v) => toggle("highTcvThreshold", v)}
                              disabled={!conditions.highTcv}
                            />
                          </ConditionRow>

                          <ConditionRow
                            label="Discount above threshold"
                            description="Effective discount applied to the invoice"
                            enabled={conditions.discountAboveThreshold}
                            onToggle={(v) => toggle("discountAboveThreshold", v)}
                          >
                            <ThresholdInput
                              suffix="%"
                              value={conditions.discountThresholdPct}
                              onChange={(v) => toggle("discountThresholdPct", v)}
                              disabled={!conditions.discountAboveThreshold}
                              max={100}
                            />
                          </ConditionRow>

                          <ConditionRow
                            label="Custom payment terms"
                            description="Anything other than standard Net 30"
                            enabled={conditions.customPaymentTerms}
                            onToggle={(v) => toggle("customPaymentTerms", v)}
                          />

                          <ConditionRow
                            label="Backdated invoice"
                            description="Invoice date is earlier than today"
                            enabled={conditions.backdatedInvoice}
                            onToggle={(v) => toggle("backdatedInvoice", v)}
                          />

                          <ConditionRow
                            label="Manual line items added"
                            description="Operator added line items outside contract"
                            enabled={conditions.manualLineItems}
                            onToggle={(v) => toggle("manualLineItems", v)}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] text-text-muted">
                    You can change this anytime under{" "}
                    <span className="font-medium text-text-secondary">
                      Settings → Billing → Approval policy
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConditionRow({
  label,
  description,
  enabled,
  onToggle,
  children,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-md border bg-white px-3 py-2.5 transition-colors",
        enabled ? "border-[color:var(--color-info)]/35" : "border-border-default",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          enabled ? selectedRadioClass : "border-border-default bg-white",
        )}
        aria-pressed={enabled}
      >
        {enabled && (
          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L4.75 8.75L9.5 4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-text-primary">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-text-muted">{description}</p>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function ThresholdInput({
  value,
  onChange,
  disabled,
  prefix,
  suffix,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
  max?: number;
}) {
  return (
    <div
      className={cn(
        "flex h-9 items-center rounded-md border bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors",
        disabled
          ? "border-border-default opacity-50"
          : "border-border-default hover:border-gray-300 focus-within:border-[color:var(--color-info)] focus-within:ring-2 focus-within:ring-blue-100",
      )}
    >
      {prefix && <span className="mr-1 text-[13px] text-text-muted">{prefix}</span>}
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          onChange(max ? Math.min(v, max) : v);
        }}
        disabled={disabled}
        className="w-24 bg-transparent text-right text-[14px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed"
      />
      {suffix && <span className="ml-1 text-[13px] text-text-muted">{suffix}</span>}
    </div>
  );
}
