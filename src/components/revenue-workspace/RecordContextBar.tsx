import { useEffect, useRef, useState } from "react";
import type { Quote, Contract, Invoice } from "@/data/mock-data";
import { StatusBadge } from "@/components/ui/primitives";
import { cn, currency, shortDate } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  CreditCard,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileMinus,
  GitCompare,
  HandCoins,
  LayoutList,
  Pause,
  Play,
  Receipt,
  RefreshCw,
  RotateCcw,
  Send,
  Shield,
  UserCheck,
} from "lucide-react";
import type { Stage } from "./RevenueJourneyRail";
import type { InvoiceEnrichment, CollectionCase } from "@/data/billing-data";
import type { RevenueArrangement } from "@/data/revrec-data";

function ActionButton({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 shrink-0 items-center rounded-full border  px-3 text-[13px] font-medium leading-none text-text-secondary transition-colors hover:border-border-default hover:bg-gray-200 hover:text-text-primary",
        Icon ? "gap-1.5" : undefined,
      )}
    >
      {Icon ? <Icon size={12} className="shrink-0" /> : null}
      {label}
    </button>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-3 text-[13px] font-medium leading-none text-text-secondary transition-colors hover:border-border-default hover:bg-gray-200 hover:text-text-primary"
    >
      <LayoutList size={12} className="shrink-0" />
      All
    </button>
  );
}

function QuoteContextBar({
  quote,
  quoteVersions,
  onQuoteVersionChange,
  onBack,
}: {
  quote: Quote;
  quoteVersions: Quote[];
  onQuoteVersionChange: (nextQuote: Quote) => void;
  onBack?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      {onBack && (
        <>
          <BackButton onBack={onBack} />
          <span className="text-text-muted">|</span>
        </>
      )}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="inline-flex items-center gap-2 rounded-full border border-border-default bg-white px-3 py-1.5 transition-colors hover:bg-surface-muted"
        >
          <span className="font-semibold text-text-primary">{quote.id}</span>
          <span className="text-text-muted">v{quote.version}</span>
          <StatusBadge status={quote.status} />
          <ChevronDown size={14} className="text-text-muted" />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[420px] rounded-lg border border-border-default bg-white p-2 shadow-lg">
            <div className="mb-1 px-2 py-1 text-[11px] uppercase tracking-wider text-text-muted">
              Quote versions
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {quoteVersions.map((versionQuote) => {
                const isSelected = versionQuote.id === quote.id;
                return (
                  <button
                    key={versionQuote.id}
                    type="button"
                    onClick={() => {
                      onQuoteVersionChange(versionQuote);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors ${
                      isSelected
                        ? "border-cb-orange/30 bg-cb-orange/5"
                        : "border-transparent hover:border-border-default hover:bg-surface-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{versionQuote.id}</span>
                      <span className="text-text-muted">v{versionQuote.version}</span>
                      <StatusBadge status={versionQuote.status} />
                    </div>
                    <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">{versionQuote.versionSummary}</p>
                    {versionQuote.status === "Rejected" && versionQuote.rejectionReason && (
                      <p className="mt-1 text-[11px] text-rose-600">
                        Rejection reason: {versionQuote.rejectionReason}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
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

function ContractContextBar({ contract, onBack }: { contract: Contract; onBack?: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      {onBack && (
        <>
          <BackButton onBack={onBack} />
          <span className="text-text-muted">|</span>
        </>
      )}
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
      <ActionButton label="Create Amendment" />
      <ActionButton label="Contract PDF" />
    </>
  );
}

function InvoicingContextBar({
  invoice,
  enrichment,
  onBack,
}: {
  invoice: Invoice;
  enrichment?: InvoiceEnrichment;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border-default bg-surface-muted px-4 py-2.5 text-[13px]">
      {onBack && (
        <>
          <BackButton onBack={onBack} />
          <span className="text-text-muted">|</span>
        </>
      )}
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
  quote: Quote | null;
  quoteVersions: Quote[];
  onQuoteVersionChange: (nextQuote: Quote) => void;
  contract: Contract | null;
  invoice?: Invoice;
  invoiceEnrichment?: InvoiceEnrichment;
  primaryCollectionCase?: CollectionCase;
  totalOpenAr?: number;
  revenueArrangement?: RevenueArrangement;
  onBack?: () => void;
}

export function RecordContextBar({
  activeStage,
  quote,
  quoteVersions,
  onQuoteVersionChange,
  contract,
  invoice,
  invoiceEnrichment,
  primaryCollectionCase,
  totalOpenAr,
  revenueArrangement,
  onBack,
}: Props) {
  switch (activeStage) {
    case "quote":
      return quote ? (
        <QuoteContextBar
          quote={quote}
          quoteVersions={quoteVersions}
          onQuoteVersionChange={onQuoteVersionChange}
          onBack={onBack}
        />
      ) : null;
    case "contract":
      return contract ? <ContractContextBar contract={contract} onBack={onBack} /> : null;
    case "invoicing":
      return invoice ? <InvoicingContextBar invoice={invoice} enrichment={invoiceEnrichment} onBack={onBack} /> : null;
    case "payment":
      return <PaymentContextBar primaryCase={primaryCollectionCase} totalOpen={totalOpenAr ?? 0} />;
    case "revrec":
      return <RevRecContextBar arrangement={revenueArrangement} />;
    default:
      return null;
  }
}

export function RecordContextActions({
  activeStage,
  invoice,
  primaryCollectionCase,
  revenueArrangement,
}: Pick<Props, "activeStage" | "invoice" | "primaryCollectionCase" | "revenueArrangement">) {
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
