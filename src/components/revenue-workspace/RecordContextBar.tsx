import type { Quote, Contract, Invoice } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import { ChevronRight, CreditCard, Download, Edit, ExternalLink, Eye, FileCheck, FileMinus, GitCompare, HandCoins, Pause, Play, Receipt, RefreshCw, RotateCcw, Send, Shield, UserCheck } from "lucide-react";
import type { Stage } from "./RevenueJourneyRail";
import type { InvoiceEnrichment, CollectionCase } from "@/data/billing-data";
import type { RevenueArrangement } from "@/data/revrec-data";

function ActionButton({ icon: Icon, label }: { icon: typeof Edit; label: string }) {
  return (
    <button className="inline-flex items-center gap-1.5 rounded-md border border-border-default bg-white px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary">
      <Icon size={13} />
      {label}
    </button>
  );
}

function QuoteContextBar({ quote }: { quote: Quote }) {
  return (
    <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary">{quote.id}</span>
        <span className="text-text-muted">v{quote.version}</span>
        <StatusBadge status={quote.status} />
      </div>
      <span className="text-text-muted">|</span>
      <span className="whitespace-nowrap text-text-secondary">Source: <span className="font-medium text-text-primary">{quote.source}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Amount: <span className="font-medium text-text-primary">{currency(quote.amount)}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Discount: <span className="font-medium text-text-primary">{quote.discountPct}%</span></span>
      <span className="whitespace-nowrap text-text-secondary">Expires: <span className="font-medium text-text-primary">{shortDate(quote.expiryDate)}</span></span>
      <StatusBadge status={quote.approval.status === "pending" ? "Pending Approval" : quote.approval.status} />
    </div>
  );
}

function QuoteActions() {
  return (
    <>
      <ActionButton icon={Edit} label="Edit Quote" />
      <ActionButton icon={Send} label="Submit for Approval" />
      <ActionButton icon={ExternalLink} label="Send Quote" />
      <ActionButton icon={GitCompare} label="Compare" />
    </>
  );
}

function ContractContextBar({ contract }: { contract: Contract }) {
  return (
    <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary">{contract.id}</span>
        <StatusBadge status={contract.status} />
      </div>
      <span className="text-text-muted">|</span>
      <span className="whitespace-nowrap text-text-secondary">Signed: <span className="font-medium text-text-primary">{shortDate(contract.signedDate)}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Term: <span className="font-medium text-text-primary">{contract.term}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Min Commit: <span className="font-medium text-text-primary">{currency(contract.minAnnualCommit)}/yr</span></span>
      <span className="whitespace-nowrap text-text-secondary">Renewal: <span className="font-medium text-text-primary">{shortDate(contract.renewalDate)}</span></span>
      <StatusBadge status={contract.enforcement.enforcementStatus} />
    </div>
  );
}

function ContractActions() {
  return (
    <>
      <ActionButton icon={FileCheck} label="Review Enforcement" />
      <ActionButton icon={Edit} label="Create Amendment" />
      <ActionButton icon={ChevronRight} label="Invoice Schedule" />
      <ActionButton icon={ExternalLink} label="Signed Doc" />
    </>
  );
}

function InvoicingContextBar({ invoice, enrichment }: { invoice: Invoice; enrichment?: InvoiceEnrichment }) {
  return (
    <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary">{invoice.id}</span>
        <StatusBadge status={invoice.status} />
      </div>
      <span className="text-text-muted">|</span>
      <span className="whitespace-nowrap text-text-secondary">Amount: <span className="font-medium text-text-primary">{currency(invoice.amount)}</span></span>
      {enrichment && <span className="whitespace-nowrap text-text-secondary">Period: <span className="font-medium text-text-primary">{shortDate(enrichment.billingPeriodStart)} – {shortDate(enrichment.billingPeriodEnd)}</span></span>}
      <span className="whitespace-nowrap text-text-secondary">Due: <span className="font-medium text-text-primary">{shortDate(invoice.dueDate)}</span></span>
      {invoice.contractId && <span className="whitespace-nowrap text-text-secondary">Contract: <span className="font-medium text-text-primary">{invoice.contractId}</span></span>}
      {invoice.holdReason && <StatusBadge status="On Hold" />}
    </div>
  );
}

function InvoicingActions({ invoice }: { invoice: Invoice }) {
  return (
    <>
      <ActionButton icon={Eye} label="Review" />
      <ActionButton icon={Send} label="Approve & Send" />
      {invoice.holdReason ? <ActionButton icon={Play} label="Release Hold" /> : <ActionButton icon={Pause} label="Hold" />}
      <ActionButton icon={RefreshCw} label="Regenerate" />
      <ActionButton icon={FileMinus} label="Credit Note" />
    </>
  );
}

function PaymentContextBar({ primaryCase }: { primaryCase?: CollectionCase; totalOpen: number }) {
  if (primaryCase) {
    return (
      <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">{primaryCase.invoiceId}</span>
          <StatusBadge status={primaryCase.stage} />
        </div>
        <span className="text-text-muted">|</span>
        <span className="whitespace-nowrap text-text-secondary">Outstanding: <span className="font-medium text-red-600">{currency(primaryCase.outstandingAmount)}</span></span>
        <span className="whitespace-nowrap text-text-secondary">Days Overdue: <span className="font-medium text-text-primary">{primaryCase.daysOverdue}d</span></span>
        {primaryCase.ptpDate && <span className="whitespace-nowrap text-text-secondary">PTP: <span className="font-medium text-text-primary">{primaryCase.ptpDate}</span></span>}
        <span className="whitespace-nowrap text-text-secondary">Owner: <span className="font-medium text-text-primary">{primaryCase.owner}</span></span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      <span className="font-semibold text-text-primary">AR / Collections</span>
      <StatusBadge status="Active" />
    </div>
  );
}

function PaymentActions({ primaryCase }: { primaryCase?: CollectionCase }) {
  if (primaryCase) {
    return (
      <>
        <ActionButton icon={CreditCard} label="Record Payment" />
        <ActionButton icon={HandCoins} label="Match Payment" />
        <ActionButton icon={UserCheck} label="Promise to Pay" />
        <ActionButton icon={Receipt} label="Resend Invoice" />
      </>
    );
  }
  return (
    <>
      <ActionButton icon={CreditCard} label="Record Payment" />
      <ActionButton icon={HandCoins} label="Match Payment" />
    </>
  );
}

function RevRecContextBar({ arrangement }: { arrangement?: RevenueArrangement }) {
  if (!arrangement) {
    return (
      <div className="rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px] text-text-secondary">
        No revenue arrangement found for this contract.
      </div>
    );
  }

  const blockerCount = arrangement.closeBlockers.filter((b) => !b.resolved).length;

  return (
    <div className="flex items-center gap-5 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary">{arrangement.id}</span>
        <StatusBadge status={arrangement.status} />
      </div>
      <span className="text-text-muted">|</span>
      <span className="whitespace-nowrap text-text-secondary">Contract: <span className="font-medium text-text-primary">{arrangement.contractId}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Recognized: <span className="font-medium text-emerald-600">{currency(arrangement.recognizedToDate)}</span></span>
      <span className="whitespace-nowrap text-text-secondary">Deferred: <span className="font-medium text-amber-600">{currency(arrangement.deferred)}</span></span>
      {blockerCount > 0 && <StatusBadge status={`${blockerCount} blocker${blockerCount > 1 ? "s" : ""}`} />}
    </div>
  );
}

function RevRecActions() {
  return (
    <>
      <ActionButton icon={Eye} label="Review Schedule" />
      <ActionButton icon={Shield} label="Resolve Blocker" />
      <ActionButton icon={RotateCcw} label="Rerun Schedule" />
      <ActionButton icon={Download} label="Audit Trail" />
    </>
  );
}

interface Props {
  activeStage: Stage;
  quote: Quote;
  contract: Contract;
  invoice?: Invoice;
  invoiceEnrichment?: InvoiceEnrichment;
  primaryCollectionCase?: CollectionCase;
  totalOpenAr?: number;
  revenueArrangement?: RevenueArrangement;
}

export function RecordContextBar({ activeStage, quote, contract, invoice, invoiceEnrichment, primaryCollectionCase, totalOpenAr, revenueArrangement }: Props) {
  switch (activeStage) {
    case "quote":
      return <QuoteContextBar quote={quote} />;
    case "contract":
      return <ContractContextBar contract={contract} />;
    case "invoicing":
      return invoice ? <InvoicingContextBar invoice={invoice} enrichment={invoiceEnrichment} /> : null;
    case "payment":
      return <PaymentContextBar primaryCase={primaryCollectionCase} totalOpen={totalOpenAr ?? 0} />;
    case "revrec":
      return <RevRecContextBar arrangement={revenueArrangement} />;
    default:
      return null;
  }
}

export function RecordContextActions({ activeStage, invoice, primaryCollectionCase, revenueArrangement }: Pick<Props, "activeStage" | "invoice" | "primaryCollectionCase" | "revenueArrangement">) {
  switch (activeStage) {
    case "quote":
      return <QuoteActions />;
    case "contract":
      return <ContractActions />;
    case "invoicing":
      return invoice ? <InvoicingActions invoice={invoice} /> : null;
    case "payment":
      return <PaymentActions primaryCase={primaryCollectionCase} />;
    case "revrec":
      return revenueArrangement ? <RevRecActions /> : null;
    default:
      return null;
  }
}
