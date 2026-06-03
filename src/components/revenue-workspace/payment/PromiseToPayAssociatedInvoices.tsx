import { cn } from "@/lib/utils";
import {
  PromiseToPayInvoiceBadge,
  PromiseToPayInvoiceOverflowBadge,
} from "./PromiseToPayInvoiceCell";

export function PromiseToPayAssociatedInvoices({
  invoiceIds,
  className,
  emptyLabel,
  /** List row: cap visible badges and show +N (always single horizontal row). */
  maxVisible,
  onInvoiceClick,
}: {
  invoiceIds: string[];
  className?: string;
  emptyLabel?: string;
  maxVisible?: number;
  onInvoiceClick?: (invoiceId: string) => void;
}) {
  if (invoiceIds.length === 0) {
    if (!emptyLabel) return null;
    return (
      <span className={cn("text-[12px] font-medium text-text-muted", className)}>
        {emptyLabel}
      </span>
    );
  }

  const cap =
    maxVisible != null ? Math.max(1, Math.min(maxVisible, invoiceIds.length)) : invoiceIds.length;
  const visible = maxVisible != null ? invoiceIds.slice(0, cap) : invoiceIds;
  const overflow = maxVisible != null ? Math.max(0, invoiceIds.length - cap) : 0;

  return (
    <span
      className={cn(
        "inline-flex flex-row flex-nowrap items-center justify-end gap-1.5",
        className,
      )}
    >
      {visible.map((invoiceId) => (
        <PromiseToPayInvoiceBadge
          key={invoiceId}
          invoiceId={invoiceId}
          onClick={onInvoiceClick}
        />
      ))}
      {overflow > 0 ? <PromiseToPayInvoiceOverflowBadge count={overflow} /> : null}
    </span>
  );
}
