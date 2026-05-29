import { useState, type ReactNode } from "react";
import {
  zenithContractBillingInfo,
  zenithPaymentTermsOptions,
  type ZenithContractBillingInfo,
} from "@/data/zenith-contract-summary";
import { Input, Select } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { ZenithContractSectionCard } from "./ZenithContractSectionCard";
import { ZenithMarkTabDoneBar } from "./ZenithMarkTabDoneBar";

const fieldLabelClass =
  "text-[11px] font-semibold uppercase tracking-wider text-text-muted";

function BillingField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className={fieldLabelClass}>
        {label}
      </label>
      {children}
    </div>
  );
}

function SiteLevelDefaultBadge() {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center self-center rounded-full border border-border-default",
        "bg-gray-50 px-2.5 py-1 text-[12px] font-medium leading-tight text-text-secondary",
      )}
    >
      Site level default
    </span>
  );
}

export function ZenithContractBillingInfoTab() {
  const [billing, setBilling] = useState<ZenithContractBillingInfo>(() => ({
    ...zenithContractBillingInfo,
  }));

  return (
    <div className="flex flex-col gap-4">
      <ZenithMarkTabDoneBar tab="Billing info" />

      <ZenithContractSectionCard title="Billing terms">
        <BillingField label="Term" htmlFor="zenith-billing-term">
          <Input
            id="zenith-billing-term"
            value={billing.term}
            onChange={(e) => setBilling((prev) => ({ ...prev, term: e.target.value }))}
          />
        </BillingField>
        <BillingField label="Billing cycle" htmlFor="zenith-billing-cycle">
          <Input
            id="zenith-billing-cycle"
            value={billing.billingCycle}
            onChange={(e) =>
              setBilling((prev) => ({ ...prev, billingCycle: e.target.value }))
            }
          />
        </BillingField>
        <BillingField label="Start date" htmlFor="zenith-billing-start">
          <Input
            id="zenith-billing-start"
            value={billing.startDate}
            onChange={(e) => setBilling((prev) => ({ ...prev, startDate: e.target.value }))}
          />
        </BillingField>
      </ZenithContractSectionCard>

      <ZenithContractSectionCard title="Payment terms">
        <BillingField label="Payment terms" htmlFor="zenith-payment-terms">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[200px] flex-1">
              <Select
                id="zenith-payment-terms"
                value={billing.paymentTerms}
                onChange={(e) =>
                  setBilling((prev) => ({
                    ...prev,
                    paymentTerms: e.target.value,
                    paymentTermsIsSiteDefault:
                      e.target.value === zenithContractBillingInfo.paymentTerms,
                  }))
                }
              >
                {zenithPaymentTermsOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            {billing.paymentTermsIsSiteDefault ? <SiteLevelDefaultBadge /> : null}
          </div>
        </BillingField>
      </ZenithContractSectionCard>
    </div>
  );
}
