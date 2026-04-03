import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import type { InvoiceDetailLine, InvoiceEnrichment } from "@/data/billing-data";
import type { Invoice } from "@/data/mock-data";

const lineTypeLabels: Record<string, string> = {
  platform_fee: "Platform Fee",
  prepaid_credit: "Prepaid Credit",
  usage_overage: "Usage / Overage",
  true_up: "True-up",
  minimum_commit: "Minimum Commit",
  proration: "Proration",
  support: "Support",
};

const lineTypeBg: Record<string, string> = {
  platform_fee: "bg-blue-50 text-blue-700 border-blue-200",
  prepaid_credit: "bg-purple-50 text-purple-700 border-purple-200",
  usage_overage: "bg-amber-50 text-amber-700 border-amber-200",
  true_up: "bg-orange-50 text-orange-700 border-orange-200",
  minimum_commit: "bg-indigo-50 text-indigo-700 border-indigo-200",
  proration: "bg-gray-50 text-gray-600 border-gray-200",
  support: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function LineTypeBadge({ lineType }: { lineType: string }) {
  const colors = lineTypeBg[lineType] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${colors}`}>
      {lineTypeLabels[lineType] ?? lineType}
    </span>
  );
}

function EnrichedTable({ lines }: { lines: InvoiceDetailLine[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
          <th className="pb-2 pr-2 font-medium">Line Item</th>
          <th className="pb-2 pr-2 font-medium">Type</th>
          <th className="pb-2 pr-2 font-medium text-right">Qty</th>
          <th className="pb-2 pr-2 font-medium text-right">Unit Price</th>
          <th className="pb-2 pr-2 font-medium text-right">Discount</th>
          <th className="pb-2 pr-2 font-medium text-right">Tax</th>
          <th className="pb-2 font-medium text-right">Net Amount</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => (
          <tr key={idx} className="border-b border-border-subtle last:border-0">
            <td className="py-2 pr-2">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-text-primary">{line.name}</span>
                <span className="text-[11px] text-text-muted">{line.sku}</span>
              </div>
            </td>
            <td className="py-2 pr-2"><LineTypeBadge lineType={line.lineType} /></td>
            <td className="py-2 pr-2 text-right tabular-nums text-text-secondary">{line.quantity.toLocaleString()}</td>
            <td className="py-2 pr-2 text-right tabular-nums text-text-secondary">${line.unitPrice < 1 ? line.unitPrice.toFixed(3) : line.unitPrice.toLocaleString()}</td>
            <td className="py-2 pr-2 text-right tabular-nums text-text-secondary">{line.discount > 0 ? `${line.discount}%` : "—"}</td>
            <td className="py-2 pr-2 text-right tabular-nums text-text-secondary">{currency(line.tax)}</td>
            <td className="py-2 text-right tabular-nums font-semibold text-text-primary">{currency(line.netAmount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SimpleTable({ lines }: { lines: { description: string; amount: number }[] }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-text-muted">
          <th className="pb-2 pr-2 font-medium">Description</th>
          <th className="pb-2 font-medium text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {lines.map((line, idx) => (
          <tr key={idx} className="border-b border-border-subtle last:border-0">
            <td className="py-2 pr-2 font-medium text-text-primary">{line.description}</td>
            <td className="py-2 text-right tabular-nums font-semibold text-text-primary">{currency(line.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface Props {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
}

export function InvoiceCompositionSection({ invoice, enrichment }: Props) {
  return (
    <SectionCard title="Invoice Composition / Line Items">
      {enrichment?.detailedLineItems ? (
        <EnrichedTable lines={enrichment.detailedLineItems} />
      ) : (
        <SimpleTable lines={invoice.lineItems} />
      )}
      <div className="mt-3 flex justify-end border-t border-border-subtle pt-2 text-[13px]">
        <div className="flex items-center gap-4">
          {enrichment && <span className="text-text-muted">Tax: {currency(enrichment.taxTotal)}</span>}
          <span className="text-base font-bold text-text-primary">Total: {currency(invoice.amount)}</span>
        </div>
      </div>
    </SectionCard>
  );
}
