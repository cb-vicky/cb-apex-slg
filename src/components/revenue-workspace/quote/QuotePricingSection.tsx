import type { QuoteProduct } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";

export function QuotePricingSection({ products }: { products: QuoteProduct[] }) {
  return (
    <SectionCard title="Products & Pricing">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium text-right">Qty</th>
              <th className="pb-2 pr-4 font-medium text-right">Unit Price</th>
              <th className="pb-2 pr-4 font-medium text-right">Discount</th>
              <th className="pb-2 pr-4 font-medium text-right">Net Amount</th>
              <th className="pb-2 font-medium">Billing Model</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.sku} className="border-b border-border-subtle last:border-0">
                <td className="py-2 pr-4">
                  <div className="font-medium text-text-primary">{p.name}</div>
                  <div className="text-[11px] text-text-muted">{p.sku}</div>
                </td>
                <td className="py-2 pr-4 capitalize text-text-secondary">{p.type}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-primary">{p.quantity > 0 ? p.quantity.toLocaleString() : "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-primary">
                  {p.unitPrice >= 1 ? currency(p.unitPrice) : `$${p.unitPrice}`}
                </td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-primary">{p.discount > 0 ? `${p.discount}%` : "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums font-medium text-text-primary">{p.netAmount > 0 ? currency(p.netAmount) : "Usage-based"}</td>
                <td className="py-2 text-text-secondary">{p.billingModel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Totals */}
      <div className="mt-3 flex items-center justify-end gap-6 border-t border-border-subtle pt-3 text-[13px]">
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
