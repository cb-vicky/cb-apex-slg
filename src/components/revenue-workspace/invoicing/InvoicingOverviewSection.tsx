import type { Invoice } from "@/data/mock-data";
import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { InvoiceEnrichment } from "@/data/billing-data";

interface Props {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
}

export function InvoicingOverviewSection({ invoice, enrichment }: Props) {
  const summaryCards = [
    { label: "Status", value: <StatusBadge status={invoice.status} /> },
    { label: "Invoice Date", value: shortDate(invoice.date) },
    { label: "Due Date", value: shortDate(invoice.dueDate) },
    { label: "Total", value: currency(invoice.amount) },
    { label: "Balance Due", value: currency(enrichment?.balanceDue ?? invoice.amount) },
    { label: "Currency", value: enrichment?.currency ?? "USD" },
    { label: "Payment Terms", value: enrichment?.paymentTerms ?? "Net 30" },
    { label: "Billing Period", value: enrichment ? `${shortDate(enrichment.billingPeriodStart)} – ${shortDate(enrichment.billingPeriodEnd)}` : "—" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border-default bg-white px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{card.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Invoice Details">
        <div className="grid grid-cols-2 gap-x-8 gap-y-0">
          <KV label="Invoice ID" value={invoice.id} />
          <KV label="Contract" value={invoice.contractId || "—"} />
          <KV label="Bill-to Contact" value={enrichment?.billToContact ?? "—"} />
          <KV label="PO Number" value={enrichment?.poNumber || <span className="text-amber-600">Not provided</span>} />
          <KV label="Tax Total" value={enrichment ? currency(enrichment.taxTotal) : "—"} />
          <KV label="Owner" value={invoice.owner} />
          {invoice.holdReason && <KV label="Hold Reason" value={<span className="text-red-600">{invoice.holdReason}</span>} />}
          {invoice.disputeReason && <KV label="Dispute" value={<span className="text-red-600">{invoice.disputeReason}</span>} />}
        </div>
      </SectionCard>
    </div>
  );
}
