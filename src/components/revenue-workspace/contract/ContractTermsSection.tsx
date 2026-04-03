import type { ContractProduct } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";

export function ContractTermsSection({ products }: { products: ContractProduct[] }) {
  return (
    <SectionCard title="Signed Commercial Terms">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wider text-text-muted">
              <th className="pb-2 pr-4 font-medium">Product</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 pr-4 font-medium text-right">Qty</th>
              <th className="pb-2 pr-4 font-medium text-right">Unit Price</th>
              <th className="pb-2 pr-4 font-medium text-right">Discount</th>
              <th className="pb-2 pr-4 font-medium text-right">Min Commit</th>
              <th className="pb-2 font-medium">Billing</th>
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
                <td className="py-2 pr-4 text-right tabular-nums text-text-primary">{p.discountApplied > 0 ? `${p.discountApplied}%` : "—"}</td>
                <td className="py-2 pr-4 text-right tabular-nums text-text-primary">{p.minimumCommit > 0 ? currency(p.minimumCommit) : "—"}</td>
                <td className="py-2 text-text-secondary">{p.billingCadence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
