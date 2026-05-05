import { cn, shortDate } from "@/lib/utils";
import { formInputClass, formLabelClass } from "@/components/ui/form-field";
import { DrawerNativeSelect, DrawerSelectShell, DrawerRailIndent } from "../DrawerSelectShell";

interface Props {
  startDate: string;
  endDate: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  billingFrequency: string;
  onFrequencyChange: (v: string) => void;
  autoRenew: boolean;
  onAutoRenewChange: (v: boolean) => void;
  activationSummary: string;
  /** `flat` = drawer queue style (no outer card). */
  variant?: "panel" | "flat";
  /**
   * When true, the start-date label exposes that backdating is allowed (used by Late Renewal
   * where the operator commonly sets the effective date earlier than today).
   */
  allowBackdate?: boolean;
  className?: string;
}

const TODAY_ISO = new Date().toISOString().slice(0, 10);

export function TransitionContractTermsSection({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  billingFrequency,
  onFrequencyChange,
  autoRenew,
  onAutoRenewChange,
  activationSummary,
  variant = "panel",
  allowBackdate = false,
  className,
}: Props) {
  const isBackdated = allowBackdate && startDate && startDate < TODAY_ISO;

  if (variant === "flat") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <DrawerSelectShell id="ingest-billing-frequency" label="Billing frequency">
          <DrawerNativeSelect
            id="ingest-billing-frequency"
            value={billingFrequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Annual upfront">Annual upfront</option>
          </DrawerNativeSelect>
        </DrawerSelectShell>

        <DrawerRailIndent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={cn(formLabelClass, "flex items-center gap-1.5")}>
                  Start date
                  {allowBackdate ? (
                    <span className="text-[10px] font-normal text-text-muted">(backdate allowed)</span>
                  ) : null}
                </span>
                <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className={formInputClass} />
                {isBackdated ? (
                  <span className="text-[11px] text-amber-700">
                    Backdated to {shortDate(startDate)} — invoices for elapsed days will be clubbed into the first invoice.
                  </span>
                ) : null}
              </label>
              <label className="flex min-w-0 flex-col gap-1.5">
                <span className={formLabelClass}>End date</span>
                <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className={formInputClass} />
              </label>
            </div>

            <label className="flex items-center gap-2.5 text-[14px] text-text-primary">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100"
                checked={autoRenew}
                onChange={(e) => onAutoRenewChange(e.target.checked)}
              />
              Auto-renew
            </label>

            <div className="flex flex-col gap-1">
              <span className={formLabelClass}>Activation</span>
              <p className="text-[14px] leading-snug text-text-primary">{activationSummary}</p>
            </div>
          </div>
        </DrawerRailIndent>
      </div>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border-default bg-white p-5", className)}>
      <h3 className="mb-4 text-[14px] font-semibold text-text-primary">Contract terms</h3>
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
        <label className={cn("flex flex-col gap-1.5", formLabelClass)}>
          <span className="flex items-center gap-1.5">
            Start date
            {allowBackdate ? (
              <span className="text-[10px] font-normal text-text-muted">(backdate allowed)</span>
            ) : null}
          </span>
          <input
            type="date"
            className={formInputClass}
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
          />
          {isBackdated ? (
            <span className="text-[11px] font-normal text-amber-700">
              Backdated to {shortDate(startDate)} — invoices for elapsed days will be clubbed into the first invoice.
            </span>
          ) : null}
        </label>
        <label className={cn("flex flex-col gap-1.5", formLabelClass)}>
          <span>End date</span>
          <input
            type="date"
            className={formInputClass}
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </label>
        <label className={cn("col-span-1 flex flex-col gap-1.5 sm:col-span-2", formLabelClass)}>
          <span>Billing frequency</span>
          <select
            className={cn(formInputClass, "cursor-pointer")}
            value={billingFrequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Annual upfront">Annual upfront</option>
          </select>
        </label>
        <label className="col-span-1 inline-flex items-center gap-2.5 text-[14px] text-text-primary sm:col-span-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100"
            checked={autoRenew}
            onChange={(e) => onAutoRenewChange(e.target.checked)}
          />
          Auto-renew
        </label>
      </div>
      <p className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-[13px] leading-snug text-text-secondary">
        {activationSummary}
      </p>
    </section>
  );
}
