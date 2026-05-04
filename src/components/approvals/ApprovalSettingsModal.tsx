import { useState } from "react";
import { X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ApprovalPolicy,
  ApprovalPolicyMode,
  NonStandardConditions,
} from "@/data/approval-policy";

interface Props {
  initial: ApprovalPolicy;
  onSave: (policy: ApprovalPolicy) => void;
  onSkip: () => void;
}

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

export function ApprovalSettingsModal({ initial, onSave, onSkip }: Props) {
  const [mode, setMode] = useState<ApprovalPolicyMode>(initial.mode ?? "auto-approve");
  const [conditions, setConditions] = useState<NonStandardConditions>(initial.conditions);
  const [conditionsExpanded, setConditionsExpanded] = useState(true);

  function toggle<K extends keyof NonStandardConditions>(key: K, value: NonStandardConditions[K]) {
    setConditions((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave({ mode, conditions });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex max-h-[90vh] w-[640px] flex-col rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border-default px-6 py-4">
          <div className="min-w-0 pr-3">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Approval settings for subsequent invoices?
            </h2>
          </div>
          <button
            onClick={onSkip}
            className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-2">
            {MODE_OPTIONS.map((opt) => {
              const selected = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMode(opt.id)}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                    selected ? selectedOptionClass : "border-border-default bg-white hover:bg-surface-muted",
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
                      <p className="text-[13px] font-semibold text-text-primary">{opt.title}</p>
                      {opt.badge && (
                        <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-text-muted">{opt.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Non-standard condition inputs (only when non-standard is selected) */}
          {mode === "non-standard" && (
            <div className="mt-4 rounded-lg border border-border-default bg-surface-muted">
              <button
                type="button"
                onClick={() => setConditionsExpanded(!conditionsExpanded)}
                className="flex w-full items-center justify-between border-b border-border-default px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <Info size={12} className="text-text-muted" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                    Trigger approval when an invoice is …
                  </p>
                </div>
                {conditionsExpanded ? <ChevronUp size={14} className="text-text-muted" /> : <ChevronDown size={14} className="text-text-muted" />}
              </button>

              {conditionsExpanded && (
                <div className="space-y-3 px-4 py-3">
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
                    description="Invoice date is earlier than today (common for late renewals)"
                    enabled={conditions.backdatedInvoice}
                    onToggle={(v) => toggle("backdatedInvoice", v)}
                  />

                  <ConditionRow
                    label="Manual line items added"
                    description="Operator added or edited line items outside the contract"
                    enabled={conditions.manualLineItems}
                    onToggle={(v) => toggle("manualLineItems", v)}
                  />
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-[11px] text-text-muted">
            You can change this anytime under <span className="font-medium text-text-secondary">Settings → Billing → Approval policy</span>.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border-default px-6 py-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-[12px] font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            Skip for now
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-[color:var(--color-info)] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              Save policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
            <path d="M2.5 6.5L4.75 8.75L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
