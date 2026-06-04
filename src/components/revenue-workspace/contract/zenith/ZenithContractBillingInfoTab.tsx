import { useState, type ReactNode } from "react";
import {
  zenithAutoCollectionOptions,
  zenithContractBillingInfo,
  zenithPaymentTermsOptions,
  type ZenithContractBillingInfo,
} from "@/data/zenith-contract-summary";
import { Input, Select } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import { ZenithContractSectionCard } from "./ZenithContractSectionCard";

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

const checkboxClass =
  "mt-0.5 h-4 w-4 shrink-0 rounded border-border-default text-blue-600 focus:ring-2 focus:ring-blue-100";

const radioClass =
  "h-4 w-4 shrink-0 border-border-default text-blue-600 focus:ring-2 focus:ring-blue-100";

function InvoicingCheckboxOption({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={checkboxClass}
        />
        <span className="text-[13px] font-medium leading-snug text-text-primary">{label}</span>
      </label>
      <p className="pl-[26px] text-[12px] leading-relaxed text-text-secondary">{description}</p>
    </div>
  );
}

function InvoicingRadioOption({
  id,
  name,
  value,
  checked,
  onChange,
  label,
}: {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5">
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className={radioClass}
      />
      <span className="text-[13px] font-medium text-text-primary">{label}</span>
    </label>
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
      <div className="flex flex-col gap-2">
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
        <BillingField label="Auto collection" htmlFor="zenith-auto-collection">
          <Select
            id="zenith-auto-collection"
            value={billing.autoCollection}
            onChange={(e) =>
              setBilling((prev) => ({
                ...prev,
                autoCollection: e.target.value as ZenithContractBillingInfo["autoCollection"],
              }))
            }
          >
            {zenithAutoCollectionOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </BillingField>
        <BillingField label="PO number" htmlFor="zenith-po-number">
          <Input
            id="zenith-po-number"
            value={billing.poNumber}
            placeholder="Enter PO number"
            onChange={(e) => setBilling((prev) => ({ ...prev, poNumber: e.target.value }))}
          />
        </BillingField>
      </ZenithContractSectionCard>
      </div>

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

      <ZenithContractSectionCard
        title="Invoicing options"
        contentClassName="flex max-w-xl flex-col gap-6"
      >
        <InvoicingCheckboxOption
          id="zenith-do-not-auto-close"
          checked={billing.doNotAutoCloseInvoices}
          onChange={(checked) =>
            setBilling((prev) => ({ ...prev, doNotAutoCloseInvoices: checked }))
          }
          label="Do not auto-close invoices"
          description="Select to add or review charges before manually closing invoices."
        />
        <InvoicingCheckboxOption
          id="zenith-renewals-pending"
          checked={billing.generateRenewalsInPendingState}
          onChange={(checked) =>
            setBilling((prev) => ({ ...prev, generateRenewalsInPendingState: checked }))
          }
          label="Generate all renewal invoices in pending state"
          description="All invoices other than the first invoice will move to pending state. Invoices will close automatically or manually based on your site settings."
        />
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-[13px] font-medium text-text-primary">
            When should the invoice be generated?
          </legend>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            If there are any charges, you can generate an invoice immediately, or add them to
            unbilled charges and invoice them later.
          </p>
          <div className="mt-3 flex flex-col gap-2.5">
            <InvoicingRadioOption
              id="zenith-invoice-immediately"
              name="zenith-invoice-generation"
              value="immediately"
              checked={billing.invoiceGenerationTiming === "immediately"}
              onChange={(value) =>
                setBilling((prev) => ({
                  ...prev,
                  invoiceGenerationTiming: value as ZenithContractBillingInfo["invoiceGenerationTiming"],
                }))
              }
              label="Immediately"
            />
            <InvoicingRadioOption
              id="zenith-invoice-unbilled"
              name="zenith-invoice-generation"
              value="unbilled_charges"
              checked={billing.invoiceGenerationTiming === "unbilled_charges"}
              onChange={(value) =>
                setBilling((prev) => ({
                  ...prev,
                  invoiceGenerationTiming: value as ZenithContractBillingInfo["invoiceGenerationTiming"],
                }))
              }
              label="Add to unbilled charges"
            />
          </div>
        </fieldset>
      </ZenithContractSectionCard>
    </div>
  );
}
