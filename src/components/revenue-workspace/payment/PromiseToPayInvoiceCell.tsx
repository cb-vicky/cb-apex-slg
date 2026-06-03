import { cn } from "@/lib/utils";

const INVOICE_BADGE =
  "inline-flex items-center rounded-md border border-border-default bg-white px-2 py-0.5 text-[11px] font-semibold leading-tight text-text-secondary shadow-sm";

export function PromiseToPayInvoiceBadge({
  invoiceId,
  className,
  onClick,
}: {
  invoiceId: string;
  className?: string;
  onClick?: (invoiceId: string) => void;
}) {
  const classNames = cn(
    INVOICE_BADGE,
    "shrink-0 whitespace-nowrap",
    onClick &&
      "cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(invoiceId);
        }}
        className={classNames}
        aria-label={`View invoice ${invoiceId}`}
      >
        {invoiceId}
      </button>
    );
  }

  return <span className={classNames}>{invoiceId}</span>;
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
