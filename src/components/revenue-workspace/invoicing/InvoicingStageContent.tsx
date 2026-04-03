import type { Invoice, Contract } from "@/data/mock-data";
import { getInvoiceEnrichment, getCreditNotesForInvoice, getInvoiceSchedule } from "@/data/billing-data";
import { InvoicingOverviewSection } from "./InvoicingOverviewSection";
import { InvoiceCompositionSection } from "./InvoiceCompositionSection";
import { BillingBasisSection } from "./BillingBasisSection";
import { InvoiceDeliverySection } from "./InvoiceDeliverySection";
import { InvoicingScheduleSection } from "./InvoicingScheduleSection";

interface Props {
  invoice: Invoice;
  contract: Contract;
}

export function InvoicingStageContent({ invoice, contract }: Props) {
  const enrichment = getInvoiceEnrichment(invoice.id);
  const creditNotes = getCreditNotesForInvoice(invoice.id);
  const schedule = getInvoiceSchedule(invoice.customerId);

  return (
    <div className="flex flex-col gap-4">
      <InvoicingOverviewSection invoice={invoice} enrichment={enrichment} />
      <InvoiceCompositionSection invoice={invoice} enrichment={enrichment} />
      <BillingBasisSection invoice={invoice} enrichment={enrichment} contract={contract} />
      <InvoiceDeliverySection enrichment={enrichment} creditNotes={creditNotes} />
      <InvoicingScheduleSection invoice={invoice} enrichment={enrichment} schedule={schedule} />
    </div>
  );
}
