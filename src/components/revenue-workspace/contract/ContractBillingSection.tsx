import type { InvoiceScheduleItem } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";

export function ContractBillingSection({ schedule }: { schedule: InvoiceScheduleItem[] }) {
  return (
    <SectionCard title="Billing & Invoice Schedule">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium text-right">Amount</th>
              <th className="pb-2 pr-4 font-medium">Status</th>
              <th className="pb-2 pr-4 font-medium">Invoice</th>
              <th className="pb-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map((item, idx) => (
              <tr key={idx} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-4 text-text-primary">{shortDate(item.date)}</td>
                <td className="py-2 pr-4 text-right tabular-nums font-medium text-text-primary">{currency(item.amount)}</td>
                <td className="py-2 pr-4"><StatusBadge status={item.status} /></td>
                <td className="py-2 pr-4 text-text-secondary">{item.invoiceId ?? "—"}</td>
                <td className="py-2 text-[12px] text-text-muted">{item.holdReason ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
