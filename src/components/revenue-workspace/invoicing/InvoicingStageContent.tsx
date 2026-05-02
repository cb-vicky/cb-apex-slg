import { useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  "inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-center text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-info)] bg-[color:var(--color-info)]";

export function InvoicingStageContent({ invoice, contract, onBack }: Props) {
  const navigate = useNavigate();
  const {
    submittedInvoiceIds,
    submitInvoiceForApproval,
    addApprovalRequest,
    invoiceStatusOverrides,
    creditNoteStatusOverrides,
    approvalRequests,
  } = useIngestContext();

  const enrichment = getInvoiceEnrichment(invoice.id);
  const creditNotes = getCreditNotesForInvoice(invoice.id, creditNoteStatusOverrides);
  const schedule = getInvoiceSchedule(invoice.customerId);

  const effectiveStatus = invoiceStatusOverrides[invoice.id] ?? invoice.status;
  const isPendingReview = effectiveStatus === "Pending Review";
  const isSubmitted = submittedInvoiceIds.has(invoice.id);
  const showBanner = isPendingReview;

  const handleSendForApproval = useCallback(() => {
    const customer = customers.find((c) => c.id === invoice.customerId);
    submitInvoiceForApproval(invoice.id);
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
  }, [
    addApprovalRequest,
    invoice.amount,
    invoice.customerId,
    invoice.date,
    invoice.id,
    submitInvoiceForApproval,
  ]);

  // Determine effective invoice for display (override status if needed)
  const displayInvoice: Invoice = effectiveStatus !== invoice.status
    ? { ...invoice, status: effectiveStatus }
    : invoice;

  const approvalForInvoice = approvalRequests.find((r) => r.invoiceId === invoice.id);
  const approvalsHref = `/approvals/invoices/${invoice.id}${
    approvalForInvoice?.ingestId
      ? `?ingestId=${encodeURIComponent(approvalForInvoice.ingestId)}`
      : ""
  }`;

  const headerActions = useMemo(() => {
    const preview = <ActionButton key="preview" label="Preview" />;
    const regenerate = <ActionButton key="regen" label="Regenerate" />;
    const creditNote = <ActionButton key="cn" label="Issue credit note" />;

    if (effectiveStatus === "Cancelled") {
      return <>{preview}</>;
    }
    if (displayInvoice.holdReason) {
      return (
        <>
          {preview}
          <ActionButton label="Clear hold" />
          {regenerate}
        </>
      );
    }
    if (displayInvoice.disputeReason) {
      return (
        <>
          {preview}
          <ActionButton label="Review dispute" />
          {creditNote}
        </>
      );
    }
    if (effectiveStatus === "Pending Review") {
      if (isSubmitted) {
        return (
          <>
            {preview}
            {regenerate}
            <ActionButton label="View in Approvals" onClick={() => navigate(approvalsHref)} />
          </>
        );
      }
      return (
        <>
          {preview}
          {regenerate}
          <ActionButton label="Send for approval" onClick={handleSendForApproval} />
        </>
      );
    }
    if (effectiveStatus === "Overdue") {
      return (
        <>
          {preview}
          <ActionButton label="Record payment" />
          {creditNote}
        </>
      );
    }
    if (effectiveStatus === "Paid") {
      return (
        <>
          {preview}
          {creditNote}
        </>
      );
    }
    return (
      <>
        {preview}
        {regenerate}
        {creditNote}
      </>
    );
  }, [
    approvalsHref,
    displayInvoice.disputeReason,
    displayInvoice.holdReason,
    effectiveStatus,
    handleSendForApproval,
    isSubmitted,
    navigate,
  ]);

  return (
    <div className="flex flex-col gap-4">
      <RecordHeader
        stickyBar
        id={displayInvoice.id}
        status={displayInvoice.status}
        leadingAction={
          onBack ? <ActionButton icon={LayoutList} label="All invoices" onClick={onBack} /> : undefined
        }
        actions={headerActions}
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
