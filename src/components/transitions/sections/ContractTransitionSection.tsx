import type { TransitionDrawerIntent } from "@/data/contract-transition";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import { formInputClass } from "@/components/ui/form-field";
import { DrawerStackedField } from "../DrawerSelectShell";

const drawerInputClass = formInputClass;
const radioClass =
  "h-4 w-4 border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100";

interface Props {
  intent: TransitionDrawerIntent;
  executionDate: string;
  onExecutionDateChange: (v: string) => void;
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
  className?: string;
}

/**
 * Flat transition controls — branch on intent. Designed to live inside an
 * `IngestFieldGroup` body; the host group's title carries the intent label, so
 * no inner heading is rendered here.
 */
export function ContractTransitionSection({
  intent,
  executionDate,
  onExecutionDateChange,
  amendmentDelta,
  graceDays,
  onGraceDaysChange,
  graceBilling,
  onGraceBillingChange,
  resolution,
  onResolutionChange,
  latePhase,
  className,
}: Props) {
  if (intent === "early_renewal") {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
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
      </div>
    );
  }

  if (intent === "amendment") {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <p className="text-[13px] leading-snug text-text-secondary">
          Modify plan, quantity, or pricing on the active subscription. Changes apply on the next
          billing cycle unless you schedule an effective date in billing.
        </p>
        <div className="flex flex-col divide-y divide-border-subtle">
          <KV label="Net ARR impact (draft)" value={currency(amendmentDelta)} />
        </div>
      </div>
    );
  }

  if (intent === "late_extend") {
    if (latePhase === "extend") {
      return (
        <div className={cn("flex flex-col gap-4", className)}>
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
          <p className="text-[12px] leading-snug text-text-muted">
            Sets operational state to extended until grace ends.
          </p>
        </div>
      );
    }
    return (
      <div className={cn("flex flex-col gap-3 text-[14px] leading-snug text-text-primary", className)}>
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
    );
  }

  return (
    <p className={cn("text-[13px] text-text-muted", className)}>
      No coordinated cut-over for a net-new deal. Activation follows policy above.
    </p>
  );
}
