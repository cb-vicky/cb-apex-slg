import { SectionCard } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { DelayedPayment } from "@/data/billing-data";

function DelayedByCell({ daysLate, paidOn }: { daysLate: number; paidOn: string }) {
  const lateLabel = daysLate === 1 ? "1 day late" : `${daysLate} days late`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[12px] font-medium leading-4 text-red-700">
        {lateLabel}
      </span>
      <span className="text-text-secondary">
        Paid on {shortDate(paidOn)}
      </span>
    </div>
  );
}

interface Props {
  delayedPayments: DelayedPayment[];
}

export function DelayedPaymentsSection({ delayedPayments }: Props) {
  if (delayedPayments.length === 0) return null;

  return (
    <SectionCard title="Delayed payments history" variant="muted">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
            <th className="pb-2 pr-2 font-medium">Invoice</th>
            <th className="pb-2 pr-2 font-medium">Delayed by</th>
            <th className="pb-2 font-medium text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {delayedPayments.map((row) => (
            <tr key={row.invoiceId} className="border-b border-border-subtle last:border-0">
              <td className="py-1.5 pr-2 font-medium text-text-primary">{row.invoiceId}</td>
              <td className="py-1.5 pr-2">
                <DelayedByCell daysLate={row.daysLate} paidOn={row.paidOn} />
              </td>
              <td className="py-1.5 text-right tabular-nums font-medium text-text-primary">
                {currency(row.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </SectionCard>
  );
}
