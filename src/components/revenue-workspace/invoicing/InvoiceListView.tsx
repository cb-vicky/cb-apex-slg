import type { Invoice } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { Receipt, CreditCard } from "lucide-react";
import { getClosureCreditNotesForCustomer } from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";

interface Props {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}

export function InvoiceListView({ invoices, onSelect }: Props) {
  const { creditNoteStatusOverrides } = useIngestContext();
  // Get closure-related credit notes for the customer (if there are invoices, we have a customerId)
  const customerId = invoices[0]?.customerId;
  const closureCreditNotes = customerId
    ? getClosureCreditNotesForCustomer(customerId, creditNoteStatusOverrides)
    : [];

  if (invoices.length === 0 && closureCreditNotes.length === 0) {
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
    <div className="flex flex-col gap-6">
      {/* Invoices table */}
      {invoices.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border-default bg-white">
          {/* Column header */}
          <div className="grid grid-cols-[1fr_90px_90px_1fr_100px_110px] items-center gap-3 border-b border-border-subtle bg-surface-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
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
                className="grid w-full grid-cols-[1fr_90px_90px_1fr_100px_110px] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-muted/60"
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
      )}

      {/* Closure credit notes section */}
      {closureCreditNotes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border-default bg-white">
          <div className="flex items-center gap-2 border-b border-border-subtle bg-surface-muted px-4 py-2">
            <CreditCard size={14} className="text-text-muted" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Closure Credit Notes
            </span>
          </div>
          <div className="grid grid-cols-[1fr_90px_1fr_100px_110px] items-center gap-3 border-b border-border-subtle bg-surface-muted px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <span>Credit Note</span>
            <span>Date</span>
            <span>Contract</span>
            <span className="text-right">Amount</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-border-subtle">
            {closureCreditNotes.map((cn) => (
              <div
                key={cn.id}
                className="grid grid-cols-[1fr_90px_1fr_100px_110px] items-center gap-3 px-4 py-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-text-primary">{cn.id}</span>
                  <span className="text-[11px] text-text-muted line-clamp-1">{cn.reason}</span>
                </div>
                <span className="text-[12px] text-text-secondary">{shortDate(cn.date)}</span>
                <span className="text-[12px] text-text-secondary">{cn.contractId || "—"}</span>
                <span className="text-right text-[13px] font-medium text-red-600">-{currency(cn.amount)}</span>
                <StatusBadge status={cn.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
