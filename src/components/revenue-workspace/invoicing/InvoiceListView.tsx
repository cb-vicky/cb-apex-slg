import type { Invoice } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { Receipt } from "lucide-react";

interface Props {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}

export function InvoiceListView({ invoices, onSelect }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center">
        <Receipt size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">No invoices found for this customer.</p>
      </div>
    );
  }

  const sorted = [...invoices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
        {/* Column header */}
        <div className="grid grid-cols-[1fr_90px_90px_1fr_100px_110px] items-center gap-3 border-b border-border-subtle bg-white px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          <span>Invoice</span>
          <span>Date</span>
          <span>Due Date</span>
          <span>Contract</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {sorted.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              onClick={() => onSelect(invoice)}
              className="grid w-full grid-cols-[1fr_90px_90px_1fr_100px_110px] items-center gap-3 py-3 pl-3 pr-4 text-left transition-colors hover:bg-surface-muted/60"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-text-primary hover:text-cb-orange transition-colors">
                  {invoice.id}
                </span>
                {invoice.holdReason && (
                  <span className="text-[11px] text-amber-600">{invoice.holdReason}</span>
                )}
              </div>
              <span className="text-[12px] text-text-secondary">{shortDate(invoice.date)}</span>
              <span className="text-[12px] text-text-secondary">{shortDate(invoice.dueDate)}</span>
              <span className="text-[12px] text-text-secondary">{invoice.contractId || "—"}</span>
              <span className="text-right text-[13px] font-medium text-text-primary">{currency(invoice.amount)}</span>
              <StatusBadge status={invoice.status} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
