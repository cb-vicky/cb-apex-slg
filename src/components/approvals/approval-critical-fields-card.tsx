import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/primitives";
import {
  FormField,
  formInputClass,
  formInputShellClass,
} from "@/components/ui/form-field";
import type { InvoiceFieldOverrides } from "@/data/approval-policy";
import type { Invoice } from "@/data/mock-data";

export interface CriticalFieldsCardProps {
  invoice: Invoice;
  overrides: InvoiceFieldOverrides;
  onChange: (next: InvoiceFieldOverrides) => void;
  enrichmentBilling?: { start?: string; end?: string };
  enrichmentPaymentTerms?: string;
  enrichmentPo?: string;
  disabled: boolean;
  isBackdated: boolean;
  amountFieldLabel: string;
  dateFieldLabel: string;
  /** `card` = bordered section + two-column grid (full page). `flat` = vertical stack, ingest-style fields (drawer). */
  layout?: "card" | "flat";
}

function CriticalFieldsFields({
  invoice,
  overrides,
  onChange,
  enrichmentBilling,
  enrichmentPaymentTerms,
  enrichmentPo,
  disabled,
  isBackdated,
  amountFieldLabel,
  dateFieldLabel,
  fieldStackClass,
}: CriticalFieldsCardProps & { fieldStackClass: string }) {
  const amount = overrides.amount ?? invoice.amount;
  const dueDate = overrides.dueDate ?? invoice.dueDate;
  const invoiceDate = overrides.invoiceDate ?? invoice.date;
  const paymentTerms = overrides.paymentTerms ?? enrichmentPaymentTerms ?? "Net 30";
  const billingStart = overrides.billingPeriodStart ?? enrichmentBilling?.start ?? invoice.date;
  const billingEnd = overrides.billingPeriodEnd ?? enrichmentBilling?.end ?? invoice.dueDate;
  const taxRate = overrides.taxRate ?? 8;
  const poNumber = overrides.poNumber ?? enrichmentPo ?? "";

  return (
    <div className={fieldStackClass}>
      <FormField label={amountFieldLabel}>
        <div className={formInputShellClass}>
          <span className="mr-1 shrink-0 text-[13px] text-text-muted">$</span>
          <input
            type="number"
            value={amount}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, amount: Number(e.target.value) })}
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed disabled:text-text-muted"
          />
        </div>
      </FormField>

      <FormField label="Tax rate">
        <div className={formInputShellClass}>
          <input
            type="number"
            value={taxRate}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, taxRate: Number(e.target.value) })}
            className="h-full min-w-0 flex-1 bg-transparent text-right text-[14px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed disabled:text-text-muted"
          />
          <span className="ml-1 shrink-0 text-[13px] text-text-muted">%</span>
        </div>
      </FormField>

      <FormField
        label={dateFieldLabel}
        hint={isBackdated ? "Backdated — will trigger non-standard approval" : undefined}
      >
        <input
          type="date"
          value={invoiceDate}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, invoiceDate: e.target.value })}
          className={cn(formInputClass, isBackdated && "border-amber-300 bg-amber-50/40")}
        />
      </FormField>

      <FormField label="Due date">
        <input
          type="date"
          value={dueDate}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, dueDate: e.target.value })}
          className={formInputClass}
        />
      </FormField>

      <FormField label="Payment terms">
        <select
          value={paymentTerms}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, paymentTerms: e.target.value })}
          className={cn(formInputClass, "cursor-pointer")}
        >
          <option value="Net 0">Net 0 (Due on receipt)</option>
          <option value="Net 15">Net 15</option>
          <option value="Net 30">Net 30</option>
          <option value="Net 45">Net 45</option>
          <option value="Net 60">Net 60</option>
          <option value="Net 90">Net 90</option>
        </select>
      </FormField>

      <FormField label="PO number">
        <input
          type="text"
          value={poNumber}
          disabled={disabled}
          placeholder="—"
          onChange={(e) => onChange({ ...overrides, poNumber: e.target.value })}
          className={formInputClass}
        />
      </FormField>

      <FormField label="Billing period — start">
        <input
          type="date"
          value={billingStart}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, billingPeriodStart: e.target.value })}
          className={formInputClass}
        />
      </FormField>

      <FormField label="Billing period — end">
        <input
          type="date"
          value={billingEnd}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, billingPeriodEnd: e.target.value })}
          className={formInputClass}
        />
      </FormField>
    </div>
  );
}

export function CriticalFieldsCard(props: CriticalFieldsCardProps) {
  const layout = props.layout ?? "card";
  const isFlat = layout === "flat";

  if (isFlat) {
    return <CriticalFieldsFields {...props} fieldStackClass="flex flex-col gap-4" />;
  }

  return (
    <SectionCard title="Critical fields">
      <CriticalFieldsFields {...props} fieldStackClass="grid grid-cols-2 gap-x-5 gap-y-4" />
    </SectionCard>
  );
}
