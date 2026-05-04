import type { TransitionDrawerIntent } from "@/data/contract-transition";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import { formInputClass, formLabelClass } from "@/components/ui/form-field";
import { DrawerNativeSelect, DrawerRailIndent, DrawerSelectShell, DrawerStackedField } from "../DrawerSelectShell";

const drawerInputClass = formInputClass;
const radioClass =
  "h-4 w-4 border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100";

interface Props {
  intent: TransitionDrawerIntent;
  executionDate: string;
  onExecutionDateChange: (v: string) => void;
  settlementMethod: "credit_note" | "refund" | "charge_difference" | "defer";
  onSettlementMethodChange: (m: "credit_note" | "refund" | "charge_difference" | "defer") => void;
  amendmentDelta: number;
  /** Late renewal — extend phase */
  graceDays: number;
  onGraceDaysChange: (n: number) => void;
  graceBilling: "continue" | "pause";
  onGraceBillingChange: (m: "continue" | "pause") => void;
  /** Late renewal — resolve */
  resolution: "renew" | "replace" | "terminate";
  onResolutionChange: (r: "renew" | "replace" | "terminate") => void;
  latePhase: "extend" | "resolve";
  /** `drawer` = flat queue ingest rail (no bordered card). */
  variant?: "panel" | "drawer";
  className?: string;
}

export function ContractTransitionSection({
  intent,
  executionDate,
  onExecutionDateChange,
  settlementMethod,
  onSettlementMethodChange,
  amendmentDelta,
  graceDays,
  onGraceDaysChange,
  graceBilling,
  onGraceBillingChange,
  resolution,
  onResolutionChange,
  latePhase,
  variant = "panel",
  className,
}: Props) {
  const isDrawer = variant === "drawer";

  if (intent === "early_renewal") {
    if (isDrawer) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <p className={formLabelClass}>Transition schedule</p>
          <DrawerRailIndent>
            <div className="flex flex-col gap-4">
              <DrawerStackedField label="On date">
                <input
                  type="date"
                  className={drawerInputClass}
                  value={executionDate}
                  onChange={(e) => onExecutionDateChange(e.target.value)}
                />
              </DrawerStackedField>
              <DrawerStackedField label="Checklist">
                <ul className="space-y-2 text-[14px] leading-snug text-text-secondary">
                  <li className="flex gap-2">
                    <span className="shrink-0 text-emerald-600">✓</span>
                    Close existing contract
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-emerald-600">✓</span>
                    Activate new contract
                  </li>
                  <li className="flex gap-2">
                    <span className="shrink-0 text-emerald-600">✓</span>
                    Generate invoice
                  </li>
                </ul>
              </DrawerStackedField>
              <DrawerSelectShell id="transition-early-renew-settlement" label="Settlement">
                <DrawerNativeSelect
                  id="transition-early-renew-settlement"
                  value={settlementMethod}
                  onChange={(e) =>
                    onSettlementMethodChange(e.target.value as "credit_note" | "refund" | "charge_difference" | "defer")
                  }
                >
                  <option value="credit_note">Credit note</option>
                  <option value="refund">Refund</option>
                  <option value="charge_difference">Charge difference</option>
                  <option value="defer">Defer</option>
                </DrawerNativeSelect>
              </DrawerSelectShell>
            </div>
          </DrawerRailIndent>
        </div>
      );
    }
    return (
      <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
        <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Early renewal — transition schedule</h3>
        <div className="flex flex-col gap-4">
          <label className={cn("flex flex-col gap-1.5", formLabelClass)}>
            <span>On date</span>
            <input
              type="date"
              className={drawerInputClass}
              value={executionDate}
              onChange={(e) => onExecutionDateChange(e.target.value)}
            />
          </label>
          <ul className="space-y-2 text-[13px] leading-snug text-text-secondary">
            <li className="flex gap-2">
              <span className="text-emerald-600">✓</span> Close existing contract
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">✓</span> Activate new contract
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-600">✓</span> Generate invoice
            </li>
          </ul>
          <label className={cn("flex flex-col gap-1.5", formLabelClass)}>
            <span>Settlement</span>
            <select
              className={cn(drawerInputClass, "cursor-pointer")}
              value={settlementMethod}
              onChange={(e) =>
                onSettlementMethodChange(e.target.value as "credit_note" | "refund" | "charge_difference" | "defer")
              }
            >
              <option value="credit_note">Credit note</option>
              <option value="refund">Refund</option>
              <option value="charge_difference">Charge difference</option>
              <option value="defer">Defer</option>
            </select>
          </label>
        </div>
      </section>
    );
  }

  if (intent === "amendment") {
    if (isDrawer) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <p className={formLabelClass}>Amendment</p>
          <DrawerRailIndent>
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-snug text-text-secondary">
                Modify plan, quantity, or pricing on the active subscription. Changes apply on the next billing cycle
                unless you schedule an effective date in billing.
              </p>
              <div className="flex flex-col divide-y divide-border-subtle">
                <KV label="Net ARR impact (draft)" value={currency(amendmentDelta)} />
              </div>
            </div>
          </DrawerRailIndent>
        </div>
      );
    }
    return (
      <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
        <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Amendment</h3>
        <p className="text-[13px] leading-snug text-text-secondary">
          Modify plan, quantity, or pricing. Net ARR impact (draft):{" "}
          <span className="font-semibold text-text-primary">{currency(amendmentDelta)}</span>
        </p>
      </section>
    );
  }

  if (intent === "late_extend") {
    if (latePhase === "extend") {
      if (isDrawer) {
        return (
          <div className={cn("flex flex-col gap-2", className)}>
            <p className={formLabelClass}>Extend (grace period)</p>
            <DrawerRailIndent>
              <div className="flex flex-col gap-4">
                <DrawerStackedField label="Duration (days)">
                  <input
                    type="number"
                    min={1}
                    max={90}
                    className={drawerInputClass}
                    value={graceDays}
                    onChange={(e) => onGraceDaysChange(Number(e.target.value))}
                  />
                </DrawerStackedField>
                <DrawerStackedField label="Billing during grace">
                  <div className="flex flex-wrap gap-5 pt-0.5 text-[14px] text-text-primary">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="grace-bill"
                        className={radioClass}
                        checked={graceBilling === "continue"}
                        onChange={() => onGraceBillingChange("continue")}
                      />
                      Continue
                    </label>
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="radio"
                        name="grace-bill"
                        className={radioClass}
                        checked={graceBilling === "pause"}
                        onChange={() => onGraceBillingChange("pause")}
                      />
                      Pause
                    </label>
                  </div>
                </DrawerStackedField>
                <p className="text-[12px] leading-snug text-text-muted">Sets operational state to extended until grace ends.</p>
              </div>
            </DrawerRailIndent>
          </div>
        );
      }
      return (
        <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
          <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Extend (grace period)</h3>
          <div className="flex flex-col gap-4">
            <label className={cn("flex flex-col gap-1.5", formLabelClass)}>
              <span>Duration (days)</span>
              <input
                type="number"
                min={1}
                max={90}
                className={drawerInputClass}
                value={graceDays}
                onChange={(e) => onGraceDaysChange(Number(e.target.value))}
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className={formLabelClass}>Billing during grace</span>
              <div className="flex flex-wrap gap-5 text-[14px] text-text-primary">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="grace-bill"
                    className={radioClass}
                    checked={graceBilling === "continue"}
                    onChange={() => onGraceBillingChange("continue")}
                  />
                  Continue
                </label>
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="grace-bill"
                    className={radioClass}
                    checked={graceBilling === "pause"}
                    onChange={() => onGraceBillingChange("pause")}
                  />
                  Pause
                </label>
              </div>
            </div>
            <p className="text-[12px] leading-snug text-text-muted">Sets operational state to extended until grace ends.</p>
          </div>
        </section>
      );
    }
    if (isDrawer) {
      return (
        <div className={cn("flex flex-col gap-2", className)}>
          <p className={formLabelClass}>Resolve extension</p>
          <DrawerRailIndent>
            <div className="flex flex-col gap-3 text-[14px] leading-snug text-text-primary">
              <label className="inline-flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name="res"
                  className={cn("mt-0.5", radioClass)}
                  checked={resolution === "renew"}
                  onChange={() => onResolutionChange("renew")}
                />
                Renew existing contract
              </label>
              <label className="inline-flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name="res"
                  className={cn("mt-0.5", radioClass)}
                  checked={resolution === "replace"}
                  onChange={() => onResolutionChange("replace")}
                />
                Replace with new contract
              </label>
              <label className="inline-flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name="res"
                  className={cn("mt-0.5", radioClass)}
                  checked={resolution === "terminate"}
                  onChange={() => onResolutionChange("terminate")}
                />
                Terminate
              </label>
              <p className="text-[12px] text-text-muted">
                Replace supersedes the prior record; terminate may issue a final invoice or write-off in billing.
              </p>
            </div>
          </DrawerRailIndent>
        </div>
      );
    }
    return (
      <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
        <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Resolve extension</h3>
        <div className="flex flex-col gap-2.5 text-[14px]">
          <label className="inline-flex items-center gap-2.5">
            <input type="radio" name="res" className={radioClass} checked={resolution === "renew"} onChange={() => onResolutionChange("renew")} />
            Renew existing contract
          </label>
          <label className="inline-flex items-center gap-2.5">
            <input type="radio" name="res" className={radioClass} checked={resolution === "replace"} onChange={() => onResolutionChange("replace")} />
            Replace with new contract
          </label>
          <label className="inline-flex items-center gap-2.5">
            <input type="radio" name="res" className={radioClass} checked={resolution === "terminate"} onChange={() => onResolutionChange("terminate")} />
            Terminate
          </label>
        </div>
        <p className="mt-3 text-[12px] text-text-muted">
          Replace supersedes the prior record; terminate may issue a final invoice or write-off in billing.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
      <h3 className="mb-2 text-[14px] font-semibold text-text-primary">Transition</h3>
      <p className="text-[13px] text-text-muted">No coordinated cut-over for a net-new deal. Activation follows policy above.</p>
    </section>
  );
}
