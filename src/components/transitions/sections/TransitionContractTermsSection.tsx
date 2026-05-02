import { cn } from "@/lib/utils";
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
  className?: string;
}

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
  className,
}: Props) {
  if (variant === "flat") {
    const inputClass =
      "w-full rounded-md border border-border-default bg-white px-2 py-2 text-[13px] text-text-primary outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200/90";

    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                  Start
                </span>
                <input type="date" value={startDate} onChange={(e) => onStartChange(e.target.value)} className={inputClass} />
              </label>
              <label className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">End</span>
                <input type="date" value={endDate} onChange={(e) => onEndChange(e.target.value)} className={inputClass} />
              </label>
            </div>

            <label className="flex items-center gap-2 text-[13px] text-text-primary">
              <input
                type="checkbox"
                className="rounded border-border-default"
                checked={autoRenew}
                onChange={(e) => onAutoRenewChange(e.target.checked)}
              />
              Auto-renew
            </label>

            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Activation</span>
              <p className="text-[13px] leading-snug text-text-primary">{activationSummary}</p>
            </div>
          </div>
        </DrawerRailIndent>
      </div>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border-default bg-white p-3", className)}>
      <h3 className="mb-2 text-[12px] font-semibold text-text-primary">Contract terms</h3>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] font-medium text-text-secondary">
          Start date
          <input
            type="date"
            className="mt-0.5 w-full rounded-md border border-border-default px-2 py-1 text-[12px]"
            value={startDate}
            onChange={(e) => onStartChange(e.target.value)}
          />
        </label>
        <label className="text-[11px] font-medium text-text-secondary">
          End date
          <input
            type="date"
            className="mt-0.5 w-full rounded-md border border-border-default px-2 py-1 text-[12px]"
            value={endDate}
            onChange={(e) => onEndChange(e.target.value)}
          />
        </label>
        <label className="col-span-2 text-[11px] font-medium text-text-secondary">
          Billing frequency
          <select
            className="mt-0.5 w-full rounded-md border border-border-default px-2 py-1 text-[12px]"
            value={billingFrequency}
            onChange={(e) => onFrequencyChange(e.target.value)}
          >
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Annual upfront">Annual upfront</option>
          </select>
        </label>
        <label className="col-span-2 inline-flex items-center gap-2 text-[13px] text-text-primary">
          <input type="checkbox" checked={autoRenew} onChange={(e) => onAutoRenewChange(e.target.checked)} />
          Auto-renew
        </label>
      </div>
      <p className="mt-2 rounded-md bg-surface-muted px-2 py-1.5 text-[11px] text-text-secondary">
        {activationSummary}
      </p>
    </section>
  );
}
