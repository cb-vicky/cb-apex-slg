import { cn } from "@/lib/utils";

const INVOICE_BADGE =
  "inline-flex items-center rounded-md border border-border-default bg-white px-2 py-0.5 text-[11px] font-semibold leading-tight text-text-secondary shadow-sm";

export function PromiseToPayInvoiceBadge({
  invoiceId,
  className,
}: {
  invoiceId: string;
  className?: string;
}) {
  return (
    <span className={cn(INVOICE_BADGE, "shrink-0 whitespace-nowrap", className)}>
      {invoiceId}
    </span>
  );
}

export function PromiseToPayInvoiceOverflowBadge({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  return (
    <span
      className={cn(INVOICE_BADGE, "shrink-0 whitespace-nowrap tabular-nums", className)}
      title={`${count} more linked invoice${count === 1 ? "" : "s"}`}
    >
      +{count}
    </span>
  );
}

/** Plain text invoice id (e.g. edit form). */
export function PromiseToPayInvoiceCell({
  invoiceId,
  className,
}: {
  invoiceId: string;
  className?: string;
}) {
  return (
    <span className={cn("text-[13px] font-semibold text-text-primary", className)}>
      {invoiceId}
    </span>
  );
}
