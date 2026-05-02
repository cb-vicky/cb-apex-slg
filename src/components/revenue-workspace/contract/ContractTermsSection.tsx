import type { ContractProduct } from "@/data/mock-data";
import { SectionCard } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import { WorkspaceTableShell, WTable, WThead, WTh, WTbody, WTr, WTd } from "@/components/ui/data-table";

export function ContractTermsSection({ products }: { products: ContractProduct[] }) {
  return (
    <SectionCard title="Signed Commercial Terms" bodyClassName="p-0">
      <WorkspaceTableShell className="rounded-none border-0 shadow-none">
        <WTable className="text-[14px] leading-snug">
          <WThead className="text-[12px] [&_th]:px-3.5 [&_th]:py-3">
            <WTh>Product</WTh>
            <WTh>Type</WTh>
            <WTh align="right" sortable>
              Qty
            </WTh>
            <WTh align="right" sortable>
              Unit price
            </WTh>
            <WTh align="right" sortable>
              Discount
            </WTh>
            <WTh align="right" sortable>
              Min commit
            </WTh>
            <WTh>Billing</WTh>
          </WThead>
          <WTbody striped={false}>
            {products.map((p) => (
              <WTr key={p.sku}>
                <WTd className="px-3.5 py-3">
                  <span className="font-semibold text-text-primary">{p.name}</span>
                  <span className="font-normal text-text-muted"> · {p.sku}</span>
                </WTd>
                <WTd className="px-3.5 py-3 capitalize text-[13px] text-text-secondary">{p.type}</WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {p.quantity > 0 ? p.quantity.toLocaleString() : "—"}
                </WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {p.unitPrice >= 1 ? currency(p.unitPrice) : `$${p.unitPrice}`}
                </WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {p.discountApplied > 0 ? `${p.discountApplied}%` : "—"}
                </WTd>
                <WTd align="right" className="px-3.5 py-3 tabular-nums">
                  {p.minimumCommit > 0 ? currency(p.minimumCommit) : "—"}
                </WTd>
                <WTd className="px-3.5 py-3 text-[13px] text-text-secondary">{p.billingCadence}</WTd>
              </WTr>
            ))}
          </WTbody>
        </WTable>
      </WorkspaceTableShell>
    </SectionCard>
  );
}
