import { Plus, X } from "lucide-react";
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
  /** When true, amount and tax rate are displayed as computed (readonly for operator). */
  amountComputed?: boolean;
  /** Discount percent (0-100). When provided, shows discount row. */
  discountPercent?: number;
  onDiscountChange?: (percent: number) => void;
  /** When true, show "Add discount" CTA; when discount > 0, show the input. */
  showDiscountControl?: boolean;
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
  amountComputed,
  discountPercent = 0,
  onDiscountChange,
  showDiscountControl,
}: CriticalFieldsCardProps & { fieldStackClass: string }) {
  const baseAmount = invoice.amount;
  const discountAmount = Math.round(baseAmount * (discountPercent / 100));
  const computedAmount = baseAmount - discountAmount;
  const amount = amountComputed ? computedAmount : (overrides.amount ?? invoice.amount);
  const dueDate = overrides.dueDate ?? invoice.dueDate;
  const invoiceDate = overrides.invoiceDate ?? invoice.date;
  const paymentTerms = overrides.paymentTerms ?? enrichmentPaymentTerms ?? "Net 30";
  const billingStart = overrides.billingPeriodStart ?? enrichmentBilling?.start ?? invoice.date;
  const billingEnd = overrides.billingPeriodEnd ?? enrichmentBilling?.end ?? invoice.dueDate;
  const taxRate = overrides.taxRate ?? 8;
  const poNumber = overrides.poNumber ?? enrichmentPo ?? "";

  const showDiscountInput = showDiscountControl && discountPercent > 0;
  const showDiscountCta = showDiscountControl && discountPercent === 0;

  return (
    <div className={fieldStackClass}>
      <FormField label={amountFieldLabel}>
        <div className={cn(formInputShellClass, amountComputed && "bg-gray-50")}>
          <span className="mr-1 shrink-0 text-[13px] text-text-muted">$</span>
          <input
            type="number"
            value={amount}
            disabled={disabled || amountComputed}
            onChange={(e) => onChange({ ...overrides, amount: Number(e.target.value) })}
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent text-[14px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed",
              amountComputed && "text-text-muted",
            )}
          />
        </div>
        {amountComputed && (
          <p className="mt-1 text-[11px] text-text-muted">Computed from line items</p>
        )}
      </FormField>

      <FormField label="Tax rate">
        <div className={cn(formInputShellClass, amountComputed && "bg-gray-50")}>
          <input
            type="number"
            value={taxRate}
            disabled={disabled || amountComputed}
            onChange={(e) => onChange({ ...overrides, taxRate: Number(e.target.value) })}
            className={cn(
              "h-full min-w-0 flex-1 bg-transparent text-right text-[14px] font-medium tabular-nums text-text-primary outline-none disabled:cursor-not-allowed",
              amountComputed && "text-text-muted",
            )}
          />
          <span className="ml-1 shrink-0 text-[13px] text-text-muted">%</span>
        </div>
        {amountComputed && (
          <p className="mt-1 text-[11px] text-text-muted">Computed from contract terms</p>
        )}
      </FormField>

      {showDiscountCta && onDiscountChange && (
        <button
          type="button"
          onClick={() => onDiscountChange(5)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--color-info)] hover:underline"
        >
          <Plus size={14} />
          Add blanket discount
        </button>
      )}

      {showDiscountInput && onDiscountChange && (
        <FormField label="Blanket discount">
          <div className="flex items-center gap-2">
            <div className={cn(formInputShellClass, "flex-1")}>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => onDiscountChange(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="h-full min-w-0 flex-1 bg-transparent text-right text-[14px] font-medium tabular-nums text-text-primary outline-none"
              />
              <span className="ml-1 shrink-0 text-[13px] text-text-muted">%</span>
            </div>
            <button
              type="button"
              onClick={() => onDiscountChange(0)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border-default text-text-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
              title="Remove discount"
            >
              <X size={14} />
            </button>
          </div>
          {discountPercent > 0 && (
            <p className="mt-1 text-[11px] text-text-muted">
              Discount: -{((baseAmount * discountPercent) / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </p>
          )}
        </FormField>
      )}

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
