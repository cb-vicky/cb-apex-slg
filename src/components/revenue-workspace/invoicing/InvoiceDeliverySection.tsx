import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { InvoiceEnrichment, CreditNote } from "@/data/billing-data";

interface Props {
  enrichment?: InvoiceEnrichment;
  creditNotes: CreditNote[];
}

export function InvoiceDeliverySection({ enrichment, creditNotes }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {enrichment && enrichment.deliveryHistory.length > 0 && (
        <SectionCard title="Delivery & Customer Communication">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Date</th>
                <th className="pb-2 pr-2 font-medium">Method</th>
                <th className="pb-2 pr-2 font-medium">Recipient</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrichment.deliveryHistory.map((event, idx) => (
                <tr key={idx} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 text-text-secondary">{shortDate(event.date)}</td>
                  <td className="py-1.5 pr-2 text-text-primary">{event.method}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{event.recipient}</td>
                  <td className="py-1.5"><StatusBadge status={event.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}

      {enrichment && enrichment.deliveryHistory.length === 0 && (
        <SectionCard title="Delivery & Customer Communication">
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            Invoice has not been sent. Resolve any validation issues before delivery.
          </div>
        </SectionCard>
      )}

      {creditNotes.length > 0 && (
        <SectionCard title="Corrections / Credits / Disputes">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
                <th className="pb-2 pr-2 font-medium">Credit Note</th>
                <th className="pb-2 pr-2 font-medium">Amount</th>
                <th className="pb-2 pr-2 font-medium">Reason</th>
                <th className="pb-2 pr-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {creditNotes.map((cn) => (
                <tr key={cn.id} className="border-b border-border-subtle last:border-0">
                  <td className="py-1.5 pr-2 font-medium text-text-primary">{cn.id}</td>
                  <td className="py-1.5 pr-2 tabular-nums text-red-600">-{currency(cn.amount)}</td>
                  <td className="py-1.5 pr-2 text-text-secondary">{cn.reason}</td>
                  <td className="py-1.5 pr-2"><StatusBadge status={cn.status} /></td>
                  <td className="py-1.5 text-text-secondary">{shortDate(cn.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
    </div>
  );
}
