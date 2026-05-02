import type { QuoteProduct } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import { WorkspaceTableShell, WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";

export function QuotePricingSection({ products }: { products: QuoteProduct[] }) {
  return (
    <SectionCard title="Products & Pricing" bodyClassName="p-0">
      <WorkspaceTableShell className="rounded-none border-0 shadow-none">
        <WTable>
          <WThead>
            <WTh>Product</WTh>
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
              Net Amount
            </WTh>
            <WTh>Billing Model</WTh>
          </WThead>
          <WTbody>
            {products.map((p) => (
              <WTr key={p.sku}>
                <WTd>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-text-muted"> · {p.sku}</span>
                </WTd>
                <WTd className="capitalize text-text-secondary">{p.type}</WTd>
                <WTd align="right">{p.quantity > 0 ? p.quantity.toLocaleString() : "—"}</WTd>
                <WTd align="right">{p.unitPrice >= 1 ? currency(p.unitPrice) : `$${p.unitPrice}`}</WTd>
                <WTd align="right">{p.discount > 0 ? `${p.discount}%` : "—"}</WTd>
                <WTd align="right" className="font-medium">
                  {p.netAmount > 0 ? currency(p.netAmount) : "Usage-based"}
                </WTd>
                <WTd className="text-text-secondary">{p.billingModel}</WTd>
              </WTr>
            ))}
          </WTbody>
        </WTable>
      </WorkspaceTableShell>
      <div className="flex items-center justify-end gap-6 border-t border-border-subtle px-4 py-3 text-[13px]">
        <span className="text-text-secondary">Total recurring (monthly):</span>
        <span className="font-semibold tabular-nums text-text-primary">
          {currency(products.filter((p) => p.type === "recurring").reduce((sum, p) => sum + p.netAmount, 0))}
        </span>
        <span className="text-text-secondary">One-time:</span>
        <span className="font-semibold tabular-nums text-text-primary">
          {currency(products.filter((p) => p.type === "one-time").reduce((sum, p) => sum + p.netAmount, 0))}
        </span>
      </div>
    </SectionCard>
  );
}
