import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Send, CheckCircle2, Check } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import { ZenithContractSectionCard } from "./ZenithContractSectionCard";
import {
  zenithSummaryLineItems,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { ZENITH_ANALYTICS_INC_ID } from "@/data/zenith-analytics-inc-seed";
import { cn } from "@/lib/utils";

/** Static invoice ID for the Zenith first invoice */
const ZENITH_FIRST_INVOICE_ID = "INV-ZA-2026-001";
const ZENITH_QUEUE_ITEM_ID = "queue-zenith-new-deal";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function InvoiceLineItemsTable({ items }: { items: ZenithSummaryLineItem[] }) {
  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border-default">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-subtle bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            <th className="px-4 py-2.5 text-left">Item</th>
            <th className="px-3 py-2.5 text-left">Frequency</th>
            <th className="px-3 py-2.5 text-right">Qty</th>
            <th className="px-3 py-2.5 text-right">Unit price</th>
            <th className="px-4 py-2.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3">
                <span className="font-medium text-text-primary">{item.name}</span>
              </td>
              <td className="px-3 py-3 text-text-secondary">{item.frequency}</td>
              <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                {item.quantity}
              </td>
              <td className="px-3 py-3 text-right tabular-nums text-text-primary">
                {formatMoney(item.unitPrice)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums font-medium text-text-primary">
                {formatMoney(item.totalPrice)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-border-default bg-gray-50">
            <td colSpan={4} className="px-4 py-3 text-right font-semibold text-text-primary">
              Total
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-lg font-bold text-text-primary">
              {formatMoney(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function InvoiceSummaryCard({ status }: { status?: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <FileText size={20} className="text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-text-primary">{ZENITH_FIRST_INVOICE_ID}</h3>
            {status && (
              <span className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                status === "Pending Approval" && "bg-amber-100 text-amber-800",
                status === "Posted" && "bg-emerald-100 text-emerald-800",
              )}>
                {status}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-text-secondary">
            First invoice for Zenith Analytics contract
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-[13px]">
            <div>
              <span className="text-text-muted">Due date:</span>{" "}
              <span className="font-medium text-text-primary">May 31, 2026</span>
            </div>
            <div>
              <span className="text-text-muted">Payment terms:</span>{" "}
              <span className="font-medium text-text-primary">Net 30</span>
            </div>
            <div>
              <span className="text-text-muted">Billing cycle:</span>{" "}
              <span className="font-medium text-text-primary">Annual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadyForApprovalBanner({ onSendForApproval }: { onSendForApproval: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={20} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-emerald-900">Ready for approval</p>
          <p className="text-[13px] text-emerald-700">
            All sections reviewed. Send this invoice for approval to proceed.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onSendForApproval}
        className={cn(
          "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-5",
          "bg-emerald-600 text-[13px] font-semibold text-white",
          "transition-colors hover:bg-emerald-700",
        )}
      >
        <Send size={16} strokeWidth={2} />
        Send for approval
      </button>
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
  const {
    submitInvoiceForApproval,
    setInvoiceStatusOverride,
    invoiceStatusOverrides,
    addSessionInvoice,
    addSessionContract,
    updateApprovalStatus,
    approvalRequests,
  } = useIngestContext();

  const lineItems = chrome?.contractLineItems ?? zenithSummaryLineItems;
  const unmappedCount = zenithSummaryLineItemsNeedMappingCount(lineItems);

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

  const handleSendForApproval = useCallback(() => {
    const now = new Date().toISOString();
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    // Create the session contract (Scheduled status for new ingestion)
    const contract = {
      id: ZENITH_CONTRACT_ID,
      customerId: ZENITH_ANALYTICS_INC_ID,
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
      customerId: ZENITH_ANALYTICS_INC_ID,
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

    // Submit for approval
    submitInvoiceForApproval(ZENITH_FIRST_INVOICE_ID, {
      customerId: ZENITH_ANALYTICS_INC_ID,
      customerName: "Zenith Analytics",
      invoiceAmount: invoiceTotal,
      invoiceDate: invoice.date,
      ingestId: ZENITH_QUEUE_ITEM_ID,
    });

    // Navigate to invoicing tab
    navigate(`/customers/${ZENITH_ANALYTICS_INC_ID}?tab=invoicing&invoiceId=${ZENITH_FIRST_INVOICE_ID}`);
  }, [invoiceTotal, lineItems, addSessionContract, addSessionInvoice, setInvoiceStatusOverride, submitInvoiceForApproval, navigate]);

  const handleApprove = useCallback(() => {
    // Update invoice status to Posted
    setInvoiceStatusOverride(ZENITH_FIRST_INVOICE_ID, "Posted");

    // Update approval request status
    if (approvalRequest) {
      updateApprovalStatus(approvalRequest.id, "Approved");
    }

    // Navigate to invoicing tab
    navigate(`/customers/${ZENITH_ANALYTICS_INC_ID}?tab=invoicing&invoiceId=${ZENITH_FIRST_INVOICE_ID}`);
  }, [setInvoiceStatusOverride, approvalRequest, updateApprovalStatus, navigate]);

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

        <InvoiceSummaryCard status="Posted" />

        <ZenithContractSectionCard title="Invoice line items">
          <InvoiceLineItemsTable items={lineItems} />
        </ZenithContractSectionCard>
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
      ) : (
        <ReadyForApprovalBanner onSendForApproval={handleSendForApproval} />
      )}

      <InvoiceSummaryCard status={invoiceStatus} />

      <ZenithContractSectionCard title="Invoice line items">
        <InvoiceLineItemsTable items={lineItems} />
      </ZenithContractSectionCard>
    </div>
  );
}
