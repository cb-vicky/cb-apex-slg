import { useMemo, useCallback, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertCircle, X } from "lucide-react";
import type { Invoice, Contract } from "@/data/mock-data";
import { customers } from "@/data/mock-data";
import { getInvoiceEnrichment, getCreditNotesForInvoice, getInvoiceSchedule } from "@/data/billing-data";
import { useIngestContext } from "@/context/IngestContext";
import { RecordHeader, type OverflowItem } from "../RecordHeader";
import { ActionButton } from "../primitives/ActionButton";
import { InvoicingOverviewSection } from "./InvoicingOverviewSection";
import { InvoiceCompositionSection } from "./InvoiceCompositionSection";
import { BillingBasisSection } from "./BillingBasisSection";
import { InvoiceDeliverySection } from "./InvoiceDeliverySection";
import { InvoicingScheduleSection } from "./InvoicingScheduleSection";
import { currency } from "@/lib/utils";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";

interface Props {
  invoice: Invoice;
  contract: Contract;
}

const pendingReviewPrimaryBtnClass =
  "inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-center text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-info)] bg-[color:var(--color-info)]";

export function InvoicingStageContent({ invoice, contract }: Props) {
  const navigate = useNavigate();
  const {
    submittedInvoiceIds,
    submitInvoiceForApproval,
    addApprovalRequest,
    invoiceStatusOverrides,
    creditNoteStatusOverrides,
    approvalRequests,
  } = useIngestContext();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const enrichment = getInvoiceEnrichment(invoice.id);
  const creditNotes = getCreditNotesForInvoice(invoice.id, creditNoteStatusOverrides);
  const schedule = getInvoiceSchedule(invoice.customerId);

  const effectiveStatus = invoiceStatusOverrides[invoice.id] ?? invoice.status;
  const isPendingReview = effectiveStatus === "Pending Review";
  const isSubmitted = submittedInvoiceIds.has(invoice.id);
  const showBanner = isPendingReview;

  const handleConfirmSendForApproval = useCallback(() => {
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
    setShowConfirmModal(false);
  }, [
    addApprovalRequest,
    invoice.amount,
    invoice.customerId,
    invoice.date,
    invoice.id,
    submitInvoiceForApproval,
  ]);

  const handleSendForApproval = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  // Determine effective invoice for display (override status if needed)
  const displayInvoice: Invoice = effectiveStatus !== invoice.status
    ? { ...invoice, status: effectiveStatus }
    : invoice;

  const approvalForInvoice = approvalRequests.find((r) => r.invoiceId === invoice.id);

  const goToApprovals = useCallback(() => {
    navigate(
      approvalForInvoice?.ingestId
        ? `/approvals/invoices/${invoice.id}?ingestId=${encodeURIComponent(approvalForInvoice.ingestId)}`
        : `/approvals/invoices/${invoice.id}`
    );
  }, [approvalForInvoice, invoice.id, navigate]);

  const { primaryActions, overflowItems } = useMemo(() => {
    const overflow: OverflowItem[] = [];
    let primary: ReactNode = null;

    if (effectiveStatus === "Cancelled") {
      primary = <ActionButton label="Preview" />;
    } else if (displayInvoice.holdReason) {
      primary = (
        <>
          <ActionButton label="Preview" />
          <ActionButton label="Clear hold" />
        </>
      );
      overflow.push({ label: "Regenerate" });
      overflow.push({ label: "Issue credit note" });
    } else if (displayInvoice.disputeReason) {
      primary = (
        <>
          <ActionButton label="Preview" />
          <ActionButton label="Review dispute" />
        </>
      );
      overflow.push({ label: "Issue credit note" });
      overflow.push({ label: "Regenerate" });
    } else if (effectiveStatus === "Pending Review") {
      if (isSubmitted) {
        primary = (
          <>
            <ActionButton label="Preview" />
            <ActionButton label="View in Approvals" onClick={goToApprovals} />
          </>
        );
        overflow.push({ label: "Regenerate" });
      } else {
        primary = (
          <>
            <ActionButton label="Preview" />
            <ActionButton label="Send for approval" onClick={handleSendForApproval} />
          </>
        );
        overflow.push({ label: "Regenerate" });
      }
    } else if (effectiveStatus === "Overdue") {
      primary = (
        <>
          <ActionButton label="Preview" />
          <ActionButton label="Record payment" />
        </>
      );
      overflow.push({ label: "Send reminder" });
      overflow.push({ label: "Issue credit note" });
    } else if (effectiveStatus === "Paid") {
      primary = (
        <>
          <ActionButton label="Preview" />
          <ActionButton label="Issue credit note" />
        </>
      );
    } else {
      primary = (
        <>
          <ActionButton label="Preview" />
          <ActionButton label="Regenerate" />
        </>
      );
      overflow.push({ label: "Issue credit note" });
    }

    return { primaryActions: primary, overflowItems: overflow };
  }, [
    displayInvoice.disputeReason,
    displayInvoice.holdReason,
    effectiveStatus,
    handleSendForApproval,
    isSubmitted,
    goToApprovals,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <RecordHeader actions={primaryActions} overflowItems={overflowItems} />

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
                  <h2 className="text-base font-bold leading-tight text-text-primary">
                    Awaiting approval before send
                  </h2>
                  <p className="text-[13px] leading-snug text-text-secondary">
                    This invoice is in the approvals queue. Open Approvals to track status and comments.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-base font-bold leading-tight text-text-primary">
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
                <button type="button" onClick={goToApprovals} className={pendingReviewPrimaryBtnClass}>
                  View in Approvals
                  <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
                </button>
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

      <WorkspaceSectionAnchor id="ws-section-invoice-overview">
        <InvoicingOverviewSection invoice={displayInvoice} enrichment={enrichment} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-invoice-composition">
        <InvoiceCompositionSection invoice={displayInvoice} enrichment={enrichment} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-invoice-billing-basis">
        <BillingBasisSection invoice={displayInvoice} enrichment={enrichment} contract={contract} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-invoice-delivery">
        <InvoiceDeliverySection enrichment={enrichment} creditNotes={creditNotes} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-invoice-schedule">
        <InvoicingScheduleSection invoice={displayInvoice} enrichment={enrichment} schedule={schedule} />
      </WorkspaceSectionAnchor>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowConfirmModal(false)} />
          <div className="relative z-10 w-[400px] rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-border-default px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                  <AlertCircle size={16} className="text-amber-600" />
                </div>
                <h2 className="text-[15px] font-bold text-text-primary">Send for approval?</h2>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="shrink-0 rounded-md p-1 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="text-[13px] leading-relaxed text-text-secondary">
                This invoice will be routed to the approval queue for review before it can be sent to the customer.
              </p>
              <div className="mt-3 rounded-md border border-border-default bg-surface-muted px-3 py-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Invoice</span>
                  <span className="font-medium text-text-primary">{invoice.id}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">Amount</span>
                  <span className="font-medium text-text-primary">{currency(invoice.amount)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border-default px-5 py-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-md px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendForApproval}
                className="rounded-md bg-[color:var(--color-info)] px-4 py-1.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Send for approval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
