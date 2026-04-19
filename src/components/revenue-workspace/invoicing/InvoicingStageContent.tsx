import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ChevronRight,
  Eye,
  FileMinus,
  Pause,
  Play,
  RefreshCw,
  Send,
} from "lucide-react";
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

export function InvoicingStageContent({ invoice, contract, onBack }: Props) {
  const enrichment = getInvoiceEnrichment(invoice.id);
  const creditNotes = getCreditNotesForInvoice(invoice.id);
  const schedule = getInvoiceSchedule(invoice.customerId);
  const navigate = useNavigate();

  const {
    submittedInvoiceIds,
    submitInvoiceForApproval,
    addApprovalRequest,
    invoiceStatusOverrides,
  } = useIngestContext();

  const [dismissed, setDismissed] = useState(false);

  const effectiveStatus = invoiceStatusOverrides[invoice.id] ?? invoice.status;
  const isPendingReview = effectiveStatus === "Pending Review";
  const isSubmitted = submittedInvoiceIds.has(invoice.id);
  const showBanner = isPendingReview && !dismissed;

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
        id={displayInvoice.id}
        status={displayInvoice.status}
        actions={
          <>
            {onBack && <ActionButton icon={ArrowLeft} label="All invoices" onClick={onBack} />}
            <ActionButton icon={Eye} label="Review" />
            <ActionButton icon={Send} label="Approve & Send" />
            {displayInvoice.holdReason ? (
              <ActionButton icon={Play} label="Release Hold" />
            ) : (
              <ActionButton icon={Pause} label="Hold" />
            )}
            <ActionButton icon={RefreshCw} label="Regenerate" />
            <ActionButton icon={FileMinus} label="Credit Note" />
          </>
        }
      />

      {/* Pending Review Banner */}
      {showBanner && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock size={14} className="shrink-0 text-amber-600" />
            {isSubmitted ? (
              <span className="text-[12px] font-medium text-emerald-700">
                <CheckCircle2 size={13} className="inline mr-1 text-emerald-500" />
                Submitted for approval —{" "}
                <button
                  type="button"
                  onClick={() => navigate("/approvals")}
                  className="underline hover:no-underline"
                >
                  View in Approvals
                </button>
              </span>
            ) : (
              <span className="text-[12px] font-medium text-amber-700">
                This invoice is pending review before it can be sent to the customer.
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isSubmitted && (
              <button
                type="button"
                onClick={handleSendForApproval}
                className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-amber-500"
              >
                Send for Approval
                <ChevronRight size={12} />
              </button>
            )}
            {!isSubmitted && (
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="text-[11px] text-amber-600 hover:text-amber-700"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      )}

      <InvoicingOverviewSection invoice={displayInvoice} enrichment={enrichment} />
      <InvoiceCompositionSection invoice={displayInvoice} enrichment={enrichment} />
      <BillingBasisSection invoice={displayInvoice} enrichment={enrichment} contract={contract} />
      <InvoiceDeliverySection enrichment={enrichment} creditNotes={creditNotes} />
      <InvoicingScheduleSection invoice={displayInvoice} enrichment={enrichment} schedule={schedule} />
    </div>
  );
}
