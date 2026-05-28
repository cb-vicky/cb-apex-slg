import type { CreditNote } from "@/data/billing-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { CreditCard } from "lucide-react";

interface Props {
  creditNotes: CreditNote[];
  onSelect?: (creditNote: CreditNote) => void;
}

export function CreditNoteListView({ creditNotes, onSelect }: Props) {
  if (creditNotes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center">
        <CreditCard size={24} className="text-text-muted" />
        <p className="text-[13px] text-text-muted">No credit notes found for this customer.</p>
      </div>
    );
  }

  const sorted = [...creditNotes].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
        {/* Column header */}
        <div className="grid grid-cols-[1fr_90px_1fr_100px_110px] items-center gap-3 border-b border-border-subtle bg-white px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          <span>Credit Note</span>
          <span>Date</span>
          <span>Reason</span>
          <span className="text-right">Amount</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {sorted.map((cn) => {
            const isClickable = Boolean(onSelect);
            const Component = isClickable ? "button" : "div";
            
            return (
              <Component
                key={cn.id}
                type={isClickable ? "button" : undefined}
                onClick={isClickable ? () => onSelect?.(cn) : undefined}
                className={`grid w-full grid-cols-[1fr_90px_1fr_100px_110px] items-center gap-3 py-3 pl-3 pr-4 text-left ${
                  isClickable ? "transition-colors hover:bg-surface-muted/60" : ""
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[13px] font-semibold text-text-primary ${isClickable ? "hover:text-cb-orange transition-colors" : ""}`}>
                    {cn.id}
                  </span>
                  {cn.invoiceId && (
                    <span className="text-[11px] text-text-muted">For {cn.invoiceId}</span>
                  )}
                  {cn.contractId && !cn.invoiceId && (
                    <span className="text-[11px] text-text-muted">Contract {cn.contractId}</span>
                  )}
                </div>
                <span className="text-[12px] text-text-secondary">{shortDate(cn.date)}</span>
                <span className="text-[12px] text-text-secondary line-clamp-2">{cn.reason}</span>
                <span className="text-right text-[13px] font-medium text-red-600">-{currency(cn.amount)}</span>
                <StatusBadge status={cn.status} />
              </Component>
            );
          })}
        </div>
      </div>
    </div>
  );
}
