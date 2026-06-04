import { useCallback, useMemo, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle2, Check, Minus, Plus, Download } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import {
  zenithSummaryLineItems,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { ZENITH_ANALYTICS_INC_ID } from "@/data/zenith-analytics-inc-seed";
import { cn, currency, shortDate } from "@/lib/utils";

/** Static invoice ID for the Zenith first invoice */
const ZENITH_FIRST_INVOICE_ID = "INV-ZA-2026-001";

interface InvoicePDFPreviewProps {
  invoiceId: string;
  invoiceDate: string;
  dueDate: string;
  status?: string;
  lineItems: ZenithSummaryLineItem[];
  customerName: string;
  contractId: string;
  zoom: number;
}

function InvoicePDFPreview({
  invoiceId,
  invoiceDate,
  dueDate,
  status,
  lineItems,
  customerName,
  contractId,
  zoom,
}: InvoicePDFPreviewProps) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = Math.round(subtotal * 0.0875);
  const total = subtotal + tax;

  return (
    <div
      className="mx-auto max-w-3xl rounded-lg border border-border-default bg-white shadow-sm"
      style={{ zoom: zoom / 100 } as CSSProperties}
    >
      <div className="min-h-[640px] p-8 font-sans text-[13px] leading-relaxed text-text-primary">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between border-b border-border-default pb-5">
          <div>
            <p className="text-[18px] font-bold tracking-tight text-[#012A38]">APEX</p>
            <p className="mt-0.5 text-[11px] text-text-muted">Chargebee US – Acme Merchant</p>
            <p className="text-[11px] text-text-muted">250 Montgomery St, Suite 900</p>
            <p className="text-[11px] text-text-muted">San Francisco, CA 94104</p>
            <p className="text-[11px] text-text-muted">billing@chargebee.com</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-bold uppercase tracking-widest text-text-muted">Invoice</p>
            <div className="mt-2 inline-block rounded-lg border border-border-default bg-surface-muted px-4 py-2 text-left">
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5">
                <span className="text-[11px] text-text-muted">Invoice #</span>
                <span className="text-[11px] font-semibold text-text-primary">{invoiceId}</span>
                <span className="text-[11px] text-text-muted">Date</span>
                <span className="text-[11px] font-semibold">{shortDate(invoiceDate)}</span>
                <span className="text-[11px] text-text-muted">Due Date</span>
                <span className="text-[11px] font-semibold text-amber-700">{shortDate(dueDate)}</span>
                <span className="text-[11px] text-text-muted">Status</span>
                <span className={cn(
                  "text-[11px] font-semibold",
                  status === "Posted" ? "text-emerald-600" : "text-amber-600"
                )}>
                  {status || "Draft"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-6 grid grid-cols-2 gap-8">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Bill To</p>
            <p className="font-semibold text-text-primary">{customerName}</p>
            <p className="text-[12px] text-text-secondary">Zenith Analytics Inc.</p>
            <p className="text-[12px] text-text-secondary">4th Floor, Lattice Tower, MG Road</p>
            <p className="text-[12px] text-text-secondary">Bengaluru, KA 560001, India</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Reference</p>
            <p className="text-[12px] text-text-secondary">
              Contract: <span className="font-medium text-text-primary">{contractId}</span>
            </p>
            <p className="text-[12px] text-text-secondary">
              Terms: <span className="font-medium text-text-primary">Net 30</span>
            </p>
            <p className="text-[12px] text-text-secondary">
              Period: <span className="font-medium text-text-primary">Jul 15, 2026 – Jul 14, 2027</span>
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b-2 border-[#012A38]">
              <th className="pb-2 text-left font-semibold text-text-secondary">Description</th>
              <th className="pb-2 text-center font-semibold text-text-secondary">Qty</th>
              <th className="pb-2 text-right font-semibold text-text-secondary">Unit Price</th>
              <th className="pb-2 text-right font-semibold text-text-secondary">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item) => (
              <tr key={item.id} className="border-b border-border-subtle">
                <td className="py-2.5 pr-4 text-text-primary">
                  <div>{item.name}</div>
                  <div className="text-[10px] text-text-muted">{item.frequency}</div>
                </td>
                <td className="py-2.5 text-center tabular-nums text-text-secondary">{item.quantity}</td>
                <td className="py-2.5 text-right tabular-nums text-text-secondary">{currency(item.unitPrice)}</td>
                <td className="py-2.5 text-right tabular-nums font-medium text-text-primary">
                  {currency(item.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex flex-col items-end gap-1 border-t border-border-default pt-4">
          <div className="flex w-56 items-center justify-between text-[12px]">
            <span className="text-text-secondary">Subtotal</span>
            <span className="tabular-nums font-medium">{currency(subtotal)}</span>
          </div>
          <div className="flex w-56 items-center justify-between text-[12px]">
            <span className="text-text-secondary">Tax (8.75%)</span>
            <span className="tabular-nums font-medium">{currency(tax)}</span>
          </div>
          <div className="flex w-56 items-center justify-between border-t border-border-default pt-2 text-[14px]">
            <span className="font-bold text-text-primary">Total Due</span>
            <span className="tabular-nums font-bold text-[#012A38]">{currency(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 rounded-lg border border-border-default bg-surface-muted px-4 py-3 text-[11px] text-text-muted">
          <p className="font-medium text-text-secondary">Payment Instructions</p>
          <p className="mt-0.5">Please make payment via ACH or Wire transfer to the account details provided in your billing onboarding.</p>
          <p className="mt-1">Questions? Contact <span className="text-blue-600">billing@chargebee.com</span></p>
        </div>
      </div>
    </div>
  );
}

function InvoicePreviewToolbar({
  zoom,
  setZoom,
}: {
  zoom: number;
  setZoom: (z: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pb-3">
      <div className="flex shrink-0 items-center gap-1 rounded-md border border-border-default bg-white px-2 py-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setZoom(Math.max(50, zoom - 10))}
          className="rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Zoom out"
        >
          <Minus size={14} />
        </button>
        <span className="min-w-[40px] text-center text-[11px] tabular-nums text-text-secondary">{zoom}%</span>
        <button
          type="button"
          onClick={() => setZoom(Math.min(200, zoom + 10))}
          className="rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Zoom in"
        >
          <Plus size={14} />
        </button>
        <div className="mx-1.5 h-4 w-px bg-border-default" />
        <button
          type="button"
          className="rounded p-0.5 text-text-muted hover:text-text-primary"
          aria-label="Download"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}


function PendingApprovalBanner({ onApprove }: { onApprove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <FileText size={20} className="text-amber-600" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-amber-900">Pending approval</p>
          <p className="text-[13px] text-amber-700">
            Review the invoice details and approve to proceed with posting.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onApprove}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5",
          "bg-blue-600 text-[13px] font-semibold text-white",
          "transition-colors hover:bg-blue-700",
        )}
      >
        <Check size={16} strokeWidth={2} />
        Approve
      </button>
    </div>
  );
}

/** Static contract ID for the Zenith scheduled contract created during ingestion */
const ZENITH_CONTRACT_ID = "CTR-ZA-2026-001";

export function ZenithContractInvoicePreviewTab() {
  const navigate = useNavigate();
  const chrome = useZenithContractChrome();
  const { persona } = useDemoPersona();
  const [zoom, setZoom] = useState(100);
  const {
    submitInvoiceForApproval,
    setInvoiceStatusOverride,
    invoiceStatusOverrides,
    addSessionInvoice,
    addSessionContract,
    updateApprovalStatus,
    approvalRequests,
    applyQueueItemOverride,
    completeIngestion,
    setIngestionOverallStatus,
  } = useIngestContext();

  const lineItems = chrome?.contractLineItems ?? zenithSummaryLineItems;
  const unmappedCount = zenithSummaryLineItemsNeedMappingCount(lineItems);

  // Invoice dates
  const invoiceDate = "2026-05-01";
  const dueDate = "2026-05-31";

  // Calculate total from line items
  const invoiceTotal = useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
    return subtotal * 1.0875; // Add 8.75% tax
  }, [lineItems]);

  // Get invoice status from overrides
  const invoiceStatus = invoiceStatusOverrides[ZENITH_FIRST_INVOICE_ID];
  const isPendingApproval = invoiceStatus === "Pending Approval";
  const isPosted = invoiceStatus === "Posted";

  // Check if this invoice has an approval request pending
  const approvalRequest = approvalRequests.find(
    (r) => r.invoiceId === ZENITH_FIRST_INVOICE_ID && r.status === "Pending Approval"
  );

  const customerId = chrome?.ingestionCustomerId ?? ZENITH_ANALYTICS_INC_ID;
  const queueItemId = chrome?.ingestionQueueItemId;

  const handleSendForApproval = useCallback(() => {
    const now = new Date().toISOString();
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create the session contract (Scheduled status for new ingestion)
    const contract = {
      id: ZENITH_CONTRACT_ID,
      customerId,
      sourceQuoteId: "",
      status: "Scheduled" as const,
      signedDate: now.slice(0, 10),
      effectiveDate: "2026-05-01",
      term: "12 months",
      endDate: "2027-04-30",
      tcv: subtotal,
      minAnnualCommit: subtotal * 0.8,
      prepaidCreditBalance: 0,
      prepaidCreditTotal: 0,
      renewalDate: "2027-04-30",
      products: lineItems.map((item) => ({
        sku: item.id,
        name: item.name,
        type: "recurring" as const,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountApplied: 0,
        minimumCommit: 0,
        prepaidCredits: 0,
        overageRate: 0,
        billingCadence: item.frequency,
      })),
      enforcement: {
        sourceType: "Contract Ingestion",
        linkedQuoteId: "",
        saleOrderStatus: "Pending" as const,
        enforcementStatus: "Pending" as const,
        productMappingIssues: [],
        missingFields: [],
        provisioningStatus: "Not Started" as const,
        entitlementStatus: "Pending" as const,
        manualOverrides: [],
        blockingIssues: [],
      },
      billingSchedule: [],
      amendments: [],
      invoicesGenerated: 0,
      creditNotes: 0,
      openAr: 0,
      paymentsReceived: 0,
      unappliedCash: 0,
      revRecSummary: { recognized: 0, deferred: subtotal, status: "Not Started" as const },
      signedDocumentUrl: "",
      ingestionTimestamp: now,
      extractionConfidence: 95,
      quoteMatchConfidence: 0,
      importantClauses: [],
      comparisonToQuote: [],
      timeline: [
        {
          date: now,
          action: "Contract ingested",
          actor: "System",
          detail: "Created from ZenithAnalytics_NewBusiness_Contract_2026_Signed.pdf",
        },
      ],
      paymentTerms: "Net 30",
      billingFrequency: "Annual upfront",
      coTermBehavior: "Standard" as const,
      owner: "Alex Nguyen",
    };

    addSessionContract(contract);

    // Create the session invoice
    const invoice = {
      id: ZENITH_FIRST_INVOICE_ID,
      customerId,
      contractId: ZENITH_CONTRACT_ID,
      date: now.slice(0, 10),
      dueDate: "2026-05-31",
      amount: invoiceTotal,
      status: "Pending Approval",
      lineItems: lineItems.map((item) => ({
        description: item.name,
        amount: item.totalPrice,
      })),
      owner: "Alex Nguyen",
    };

    addSessionInvoice(invoice);
    setInvoiceStatusOverride(ZENITH_FIRST_INVOICE_ID, "Pending Approval");

    submitInvoiceForApproval(ZENITH_FIRST_INVOICE_ID, {
      customerId,
      customerName: "Zenith Analytics",
      invoiceAmount: invoiceTotal,
      invoiceDate: invoice.date,
      ingestId: queueItemId,
    });

    if (queueItemId) {
      applyQueueItemOverride(queueItemId, {
        status: "Ingested",
        contractId: ZENITH_CONTRACT_ID,
        invoiceId: ZENITH_FIRST_INVOICE_ID,
        customerId,
      });
      setIngestionOverallStatus(queueItemId, "awaiting_approval");
    }

    navigate(`/customers/${customerId}?tab=invoicing&invoiceId=${ZENITH_FIRST_INVOICE_ID}`);
  }, [
    invoiceTotal,
    lineItems,
    addSessionContract,
    addSessionInvoice,
    setInvoiceStatusOverride,
    submitInvoiceForApproval,
    navigate,
    customerId,
    queueItemId,
    applyQueueItemOverride,
    setIngestionOverallStatus,
  ]);

  const handleApprove = useCallback(() => {
    setInvoiceStatusOverride(ZENITH_FIRST_INVOICE_ID, "Posted");

    if (approvalRequest) {
      updateApprovalStatus(approvalRequest.id, "Approved");
    }

    if (queueItemId) {
      completeIngestion(queueItemId);
    }

    navigate(`/customers/${customerId}?tab=invoicing&invoiceId=${ZENITH_FIRST_INVOICE_ID}`);
  }, [
    setInvoiceStatusOverride,
    approvalRequest,
    updateApprovalStatus,
    navigate,
    customerId,
    queueItemId,
    completeIngestion,
  ]);

  // If there are still unmapped items, show a warning
  if (unmappedCount > 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="text-[14px] font-medium text-amber-900">
            Cannot preview invoice — {unmappedCount} item{unmappedCount === 1 ? "" : "s"} still need
            mapping.
          </p>
          <p className="mt-1 text-[13px] text-amber-700">
            Go back to the Items tab to resolve all mapping issues.
          </p>
        </div>
      </div>
    );
  }

  // If already posted, show success state
  if (isPosted) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-emerald-900">Invoice approved and posted</p>
            <p className="text-[13px] text-emerald-700">
              The invoice has been approved and is now posted.
            </p>
          </div>
        </div>

        <InvoicePreviewToolbar zoom={zoom} setZoom={setZoom} />

        <div className="overflow-auto rounded-xl bg-gray-100 p-6">
          <InvoicePDFPreview
            invoiceId={ZENITH_FIRST_INVOICE_ID}
            invoiceDate={invoiceDate}
            dueDate={dueDate}
            status="Posted"
            lineItems={lineItems}
            customerName="Zenith Analytics"
            contractId={ZENITH_CONTRACT_ID}
            zoom={zoom}
          />
        </div>
      </div>
    );
  }

  // Show appropriate banner based on persona and status
  const showApproverView = persona === "approver" && isPendingApproval;

  return (
    <div className="flex flex-col gap-4">
      {showApproverView ? (
        <PendingApprovalBanner onApprove={handleApprove} />
      ) : isPendingApproval ? (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <FileText size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-amber-900">Awaiting approval</p>
            <p className="text-[13px] text-amber-700">
              This invoice has been submitted and is pending approval.
            </p>
          </div>
        </div>
      ) : null}

      <InvoicePreviewToolbar zoom={zoom} setZoom={setZoom} />

      <div className="overflow-auto rounded-xl bg-gray-100 p-6">
        <InvoicePDFPreview
          invoiceId={ZENITH_FIRST_INVOICE_ID}
          invoiceDate={invoiceDate}
          dueDate={dueDate}
          status={invoiceStatus}
          lineItems={lineItems}
          customerName="Zenith Analytics"
          contractId={ZENITH_CONTRACT_ID}
          zoom={zoom}
        />
      </div>
    </div>
  );
}
