import { Link } from "react-router-dom";
import { ChevronRight, LayoutList } from "lucide-react";
import type { Invoice, Contract } from "@/data/mock-data";
import { customers } from "@/data/mock-data";
import { getInvoiceEnrichment, getCreditNotesForInvoice, getInvoiceSchedule } from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";
import { RecordHeader } from "../RecordHeader";
import { ActionButton } from "../primitives/ActionButton";
import { InvoicingOverviewSection } from "./InvoicingOverviewSection";
import { InvoiceCompositionSection } from "./InvoiceCompositionSection";
import { BillingBasisSection } from "./BillingBasisSection";
import { InvoiceDeliverySection } from "./InvoiceDeliverySection";
import { InvoicingScheduleSection } from "./InvoicingScheduleSection";

interface Props {
  invoice: Invoice;
  contract: Contract;
  onBack?: () => void;
}

const pendingReviewPrimaryBtnClass =
  "inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-center text-[13px] font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-cb-orange)] bg-[color:var(--color-cb-orange)]";

export function InvoicingStageContent({ invoice, contract, onBack }: Props) {
  const enrichment = getInvoiceEnrichment(invoice.id);
  const creditNotes = getCreditNotesForInvoice(invoice.id);
  const schedule = getInvoiceSchedule(invoice.customerId);

  const {
    submittedInvoiceIds,
    submitInvoiceForApproval,
    addApprovalRequest,
    invoiceStatusOverrides,
  } = useIngestContext();

  const effectiveStatus = invoiceStatusOverrides[invoice.id] ?? invoice.status;
  const isPendingReview = effectiveStatus === "Pending Review";
  const isSubmitted = submittedInvoiceIds.has(invoice.id);
  const showBanner = isPendingReview;

  function handleSendForApproval() {
    const customer = customers.find((c) => c.id === invoice.customerId);
    submitInvoiceForApproval(invoice.id);
    // Enrich the approval request with real invoice data
    addApprovalRequest({
      id: `APR-${invoice.id}`,
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      customerName: customer?.name ?? "—",
      invoiceAmount: invoice.amount,
      invoiceDate: invoice.date,
      status: "Pending Approval",
      submittedBy: "Alex Nguyen",
      submittedAt: new Date().toISOString(),
      approver: "Sarah Chen, VP Revenue",
      comments: [],
    });
  }

  // Determine effective invoice for display (override status if needed)
  const displayInvoice: Invoice = effectiveStatus !== invoice.status
    ? { ...invoice, status: effectiveStatus }
    : invoice;

  return (
    <div className="flex flex-col gap-4">
      <RecordHeader
        stickyBar
        id={displayInvoice.id}
        status={displayInvoice.status}
        leadingAction={
          onBack ? <ActionButton icon={LayoutList} label="All invoices" onClick={onBack} /> : undefined
        }
        actions={
          <>
            <ActionButton label="Preview" />
            <ActionButton label="Approve & Send" />
            <ActionButton label="Regenerate" />
            <ActionButton label="Issue credit note" />
          </>
        }
      />

      {/* Pending review — same visual approach as Account 360 “Next best action” */}
      {showBanner && (
        <section className="relative overflow-hidden rounded-xl border border-cb-orange bg-white">
          <div
            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(ellipse_110%_85%_at_100%_100%,var(--color-cb-orange-light)_0%,transparent_52%)]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(to_top_left,rgba(255,244,239,0.5)_0%,transparent_48%)]"
            aria-hidden
          />

          <div className="relative z-[2] flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between md:gap-5">
            <div className="min-w-0 flex-1 space-y-0.5">
              {isSubmitted ? (
                <>
                  <h2 className="text-base font-semibold leading-tight text-text-primary">
                    Awaiting approval before send
                  </h2>
                  <p className="text-[13px] leading-snug text-text-secondary">
                    This invoice is in the approvals queue. Open Approvals to track status and comments.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-semibold leading-tight text-text-primary">
                    Review before send
                  </h2>
                  <p className="text-[13px] leading-snug text-text-secondary">
                    This invoice is pending review before it can be sent to the customer.
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row sm:items-center md:flex-col md:items-stretch lg:flex-row lg:items-center">
              {isSubmitted ? (
                <Link to="/approvals" className={pendingReviewPrimaryBtnClass}>
                  View in Approvals
                  <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
                </Link>
              ) : (
                <button type="button" onClick={handleSendForApproval} className={pendingReviewPrimaryBtnClass}>
                  Send for Approval
                  <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      <InvoicingOverviewSection invoice={displayInvoice} enrichment={enrichment} />
      <InvoiceCompositionSection invoice={displayInvoice} enrichment={enrichment} />
      <BillingBasisSection invoice={displayInvoice} enrichment={enrichment} contract={contract} />
      <InvoiceDeliverySection enrichment={enrichment} creditNotes={creditNotes} />
      <InvoicingScheduleSection invoice={displayInvoice} enrichment={enrichment} schedule={schedule} />
    </div>
  );
}
