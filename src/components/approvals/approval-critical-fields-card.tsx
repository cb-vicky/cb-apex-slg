import { cn } from "@/lib/utils";
import { SectionCard } from "@/components/ui/primitives";
import type { InvoiceFieldOverrides } from "@/data/approval-policy";
import type { Invoice } from "@/data/mock-data";

/** Matches ingest `CustomerMappingSection` stacked fields (uppercase label + neutral focus). */
const drawerLabelClass = "text-[11px] font-semibold uppercase tracking-wide text-text-secondary";
const drawerInputClass =
  "w-full rounded-md border border-border-default bg-white px-2.5 py-2 text-[13px] text-text-primary outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200/90 disabled:cursor-not-allowed";
const drawerInputShellClass =
  "flex items-center rounded-md border border-border-default bg-white px-2.5 py-2 focus-within:border-neutral-300 focus-within:ring-1 focus-within:ring-neutral-200/90";

function EditableField({
  label,
  hint,
  children,
  isFlat,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  isFlat: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={isFlat ? drawerLabelClass : "text-[11px] font-medium text-text-muted"}>{label}</span>
      {children}
      {hint && <p className="text-[10px] text-text-muted">{hint}</p>}
    </div>
  );
}

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
  isFlat,
}: CriticalFieldsCardProps & { fieldStackClass: string; isFlat: boolean }) {
  const amount = overrides.amount ?? invoice.amount;
  const dueDate = overrides.dueDate ?? invoice.dueDate;
  const invoiceDate = overrides.invoiceDate ?? invoice.date;
  const paymentTerms = overrides.paymentTerms ?? enrichmentPaymentTerms ?? "Net 30";
  const billingStart = overrides.billingPeriodStart ?? enrichmentBilling?.start ?? invoice.date;
  const billingEnd = overrides.billingPeriodEnd ?? enrichmentBilling?.end ?? invoice.dueDate;
  const taxRate = overrides.taxRate ?? 8;
  const poNumber = overrides.poNumber ?? enrichmentPo ?? "";

  const inputBase = isFlat
    ? drawerInputClass
    : "rounded-md border border-border-default bg-white px-2 py-1 text-[12px] text-text-primary outline-none focus:border-cb-orange disabled:cursor-not-allowed";

  const amountShell = isFlat ? drawerInputShellClass : "flex items-center rounded-md border border-border-default bg-white px-2 py-1 focus-within:border-cb-orange";

  return (
    <div className={fieldStackClass}>
      <EditableField label={amountFieldLabel} isFlat={isFlat}>
        <div className={amountShell}>
          <span className="mr-0.5 text-[11px] text-text-muted">$</span>
          <input
            type="number"
            value={amount}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, amount: Number(e.target.value) })}
            className={cn(
              "w-full bg-transparent tabular-nums text-text-primary outline-none disabled:cursor-not-allowed",
              isFlat ? "text-[13px] font-medium" : "text-[12px] font-medium",
            )}
          />
        </div>
      </EditableField>

      <EditableField label="Tax rate (%)" isFlat={isFlat}>
        <div className={amountShell}>
          <input
            type="number"
            value={taxRate}
            disabled={disabled}
            onChange={(e) => onChange({ ...overrides, taxRate: Number(e.target.value) })}
            className={cn(
              "w-full bg-transparent text-right tabular-nums text-text-primary outline-none disabled:cursor-not-allowed",
              isFlat ? "text-[13px] font-medium" : "text-[12px] font-medium",
            )}
          />
          <span className="ml-0.5 text-[11px] text-text-muted">%</span>
        </div>
      </EditableField>

      <EditableField
        label={dateFieldLabel}
        hint={isBackdated ? "Backdated — will trigger non-standard approval" : undefined}
        isFlat={isFlat}
      >
        <input
          type="date"
          value={invoiceDate}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, invoiceDate: e.target.value })}
          className={cn(inputBase, isBackdated && "border-amber-300 bg-amber-50/40")}
        />
      </EditableField>

      <EditableField label="Due date" isFlat={isFlat}>
        <input type="date" value={dueDate} disabled={disabled} onChange={(e) => onChange({ ...overrides, dueDate: e.target.value })} className={inputBase} />
      </EditableField>

      <EditableField label="Payment terms" isFlat={isFlat}>
        <select
          value={paymentTerms}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, paymentTerms: e.target.value })}
          className={inputBase}
        >
          <option value="Net 0">Net 0 (Due on receipt)</option>
          <option value="Net 15">Net 15</option>
          <option value="Net 30">Net 30</option>
          <option value="Net 45">Net 45</option>
          <option value="Net 60">Net 60</option>
          <option value="Net 90">Net 90</option>
        </select>
      </EditableField>

      <EditableField label="PO number" isFlat={isFlat}>
        <input
          type="text"
          value={poNumber}
          disabled={disabled}
          placeholder="—"
          onChange={(e) => onChange({ ...overrides, poNumber: e.target.value })}
          className={cn(inputBase, "placeholder:text-text-muted")}
        />
      </EditableField>

      <EditableField label="Billing period — start" isFlat={isFlat}>
        <input
          type="date"
          value={billingStart}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, billingPeriodStart: e.target.value })}
          className={inputBase}
        />
      </EditableField>

      <EditableField label="Billing period — end" isFlat={isFlat}>
        <input
          type="date"
          value={billingEnd}
          disabled={disabled}
          onChange={(e) => onChange({ ...overrides, billingPeriodEnd: e.target.value })}
          className={inputBase}
        />
      </EditableField>
    </div>
  );
}

export function CriticalFieldsCard(props: CriticalFieldsCardProps) {
  const layout = props.layout ?? "card";
  const isFlat = layout === "flat";

  if (isFlat) {
    return <CriticalFieldsFields {...props} fieldStackClass="flex flex-col gap-2.5" isFlat />;
  }

  return (
    <SectionCard title="Critical fields">
      <CriticalFieldsFields {...props} fieldStackClass="grid grid-cols-2 gap-3" isFlat={false} />
    </SectionCard>
  );
}
