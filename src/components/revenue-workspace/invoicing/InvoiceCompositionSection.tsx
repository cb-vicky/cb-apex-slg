import { SectionCard } from "@/components/ui/primitives";
import { WorkspaceTableShell, WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";
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
    <WorkspaceTableShell className="rounded-none border-0 shadow-none">
      <WTable>
        <WThead>
          <WTh>Line Item</WTh>
          <WTh>Type</WTh>
          <WTh align="right" sortable>
            Qty
          </WTh>
          <WTh align="right" sortable>
            Unit Price
          </WTh>
          <WTh align="right" sortable>
            Discount
          </WTh>
          <WTh align="right" sortable>
            Tax
          </WTh>
          <WTh align="right" sortable>
            Net Amount
          </WTh>
        </WThead>
        <WTbody>
          {lines.map((line, idx) => (
            <WTr key={idx}>
              <WTd>
                <span className="font-medium">{line.name}</span>
                <span className="text-text-muted"> · {line.sku}</span>
              </WTd>
              <WTd truncate={false}>
                <LineTypeBadge lineType={line.lineType} />
              </WTd>
              <WTd align="right" className="text-text-secondary">
                {line.quantity.toLocaleString()}
              </WTd>
              <WTd align="right" className="text-text-secondary">
                ${line.unitPrice < 1 ? line.unitPrice.toFixed(3) : line.unitPrice.toLocaleString()}
              </WTd>
              <WTd align="right" className="text-text-secondary">
                {line.discount > 0 ? `${line.discount}%` : "—"}
              </WTd>
              <WTd align="right" className="text-text-secondary">
                {currency(line.tax)}
              </WTd>
              <WTd align="right" className="font-semibold text-text-primary">
                {currency(line.netAmount)}
              </WTd>
            </WTr>
          ))}
        </WTbody>
      </WTable>
    </WorkspaceTableShell>
  );
}

function SimpleTable({ lines }: { lines: { description: string; amount: number }[] }) {
  return (
    <WorkspaceTableShell className="rounded-none border-0 shadow-none">
      <WTable>
        <WThead>
          <WTh>Description</WTh>
          <WTh align="right" sortable>
            Amount
          </WTh>
        </WThead>
        <WTbody>
          {lines.map((line, idx) => (
            <WTr key={idx}>
              <WTd className="font-medium">{line.description}</WTd>
              <WTd align="right" className="font-semibold text-text-primary">
                {currency(line.amount)}
              </WTd>
            </WTr>
          ))}
        </WTbody>
      </WTable>
    </WorkspaceTableShell>
  );
}

interface Props {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
}

export function InvoiceCompositionSection({ invoice, enrichment }: Props) {
  return (
    <SectionCard title="Invoice Composition / Line Items" bodyClassName="p-0">
      {enrichment?.detailedLineItems ? (
        <EnrichedTable lines={enrichment.detailedLineItems} />
      ) : (
        <SimpleTable lines={invoice.lineItems} />
      )}
      <div className="flex justify-end border-t border-border-subtle px-4 py-3 text-[13px]">
        <div className="flex items-center gap-4">
          {enrichment && <span className="text-text-muted">Tax: {currency(enrichment.taxTotal)}</span>}
          <span className="text-base font-bold text-text-primary">Total: {currency(invoice.amount)}</span>
        </div>
      </div>
    </SectionCard>
  );
}
