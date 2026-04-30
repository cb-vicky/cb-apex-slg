import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { Customer, Quote, Contract, Invoice, Task, ContractClosure } from "@/data/mock-data";
import { getInvoices, getQuoteLineage, getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { extractedSample3 } from "@/data/ingest-data";
import { getCollectionCasesForCustomer } from "@/data/billing-data";
import { getRevenueArrangement } from "@/data/revrec-data";
import { useIngestContext } from "@/context/IngestContext";
import { CustomerContextBar } from "./CustomerContextBar";
import { type Stage } from "./RevenueJourneyRail";
import { QuoteStageContent } from "./quote/QuoteStageContent";
import { ContractStageContent } from "./contract/ContractStageContent";
import { CustomerStageContent } from "./customer/CustomerStageContent";
import { InvoicingStageContent } from "./invoicing/InvoicingStageContent";
import { PaymentStageContent } from "./payment/PaymentStageContent";
import { RevRecStageContent } from "./revrec/RevRecStageContent";
import {
  InsightRail,
  DEFAULT_INSIGHT_RAIL_SECTIONS,
  type InsightRailSectionKey,
} from "./InsightRail";
import { QuoteListView } from "./quote/QuoteListView";
import { ContractListView } from "./contract/ContractListView";
import { InvoiceListView } from "./invoicing/InvoiceListView";
import { CloseContractPane } from "@/components/contracts/CloseContractPane";
import type { IncomingRenewalPreview } from "@/components/contracts/CloseContractPane";
import { mergeContractsWithRuntimeClosures } from "./derive-stage-data";

// Stages that use a list-then-detail pattern
const LIST_STAGES: Stage[] = ["quote", "contract", "invoicing"];

interface Props {
  customer: Customer;
  quote: Quote | null;
  contract: Contract | null;
  tasks: Task[];
  initialStage: Stage;
  from?: string;
  activeRecordId?: string;
  /** When set to "early-renewal", auto-opens CloseContractPane for the specified contract. */
  closeIntent?: string;
  /** The queue item ID from which the close intent was triggered (for auto-ingest after approval). */
  queueItemId?: string;
}

export function CustomerRevenueWorkspace({
  customer,
  quote,
  contract,
  tasks,
  initialStage,
  from,
  activeRecordId,
  closeIntent,
  queueItemId,
}: Props) {
  const navigate = useNavigate();
  const [activeStage, setActiveStage] = useState<Stage>(
    closeIntent ? "contract" : initialStage
  );
  const { 
    contractClosures, 
    applyContractClosure, 
    closureToast, 
    showClosureToast, 
    clearClosureToast,
    submitInvoiceForApproval,
    sessionContracts,
    renewalToast,
    clearRenewalToast,
    invoiceStatusOverrides,
  } = useIngestContext();

  // When closeIntent is present, force list mode (so user sees context before pane opens)
  const [viewMode, setViewMode] = useState<"list" | "detail">(
    closeIntent ? "list" : activeRecordId ? "detail" : "list",
  );

  const [activeQuote, setActiveQuote] = useState<Quote | null>(quote);
  const [activeContract, setActiveContract] = useState<Contract | null>(contract);
  const [showClosePane, setShowClosePane] = useState(false);

  // Auto-open close pane when triggered from queue flow with early-renewal intent
  useEffect(() => {
    if (closeIntent === "early-renewal" && activeContract?.status === "Active") {
      setShowClosePane(true);
    }
  }, [closeIntent, activeContract?.status]);

  const customerQuotes = getQuotesForCustomer(customer.id);
  // Merge runtime session contracts so auto-ingested Scheduled renewals appear
  const seedContracts = getContractsForCustomer(customer.id);
  const sessionContractsForCustomer = sessionContracts.filter((c) => c.customerId === customer.id);
  const customerContracts = [...seedContracts, ...sessionContractsForCustomer.filter((c) => !seedContracts.some((s) => s.id === c.id))];

  /** List + rail: apply runtime closures so rows match Contract detail / CloseContractPane. */
  const contractsForListView = useMemo(
    () => mergeContractsWithRuntimeClosures(customerContracts, contractClosures),
    [customerContracts, contractClosures],
  );

  const customerInvoicesRaw = getInvoices(customer.id);

  /** List + initial selection: apply approval invoice status overrides */
  const invoicesForListView = useMemo(() => {
    return customerInvoicesRaw.map((inv) => {
      const st = invoiceStatusOverrides[inv.id];
      return st !== undefined ? { ...inv, status: st } : inv;
    });
  }, [customerInvoicesRaw, invoiceStatusOverrides]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!closureToast) return;
    const timer = setTimeout(() => clearClosureToast(), 2400);
    return () => clearTimeout(timer);
  }, [closureToast, clearClosureToast]);

  useEffect(() => {
    if (!renewalToast) return;
    const timer = setTimeout(() => clearRenewalToast(), 3500);
    return () => clearTimeout(timer);
  }, [renewalToast, clearRenewalToast]);

  // Merge seed contracts with runtime closures
  function getEffectiveContract(c: Contract | null): Contract | null {
    if (!c) return null;
    const runtimeClosure = contractClosures[c.id];
    if (runtimeClosure) {
      const today = new Date().toISOString().slice(0, 10);
      const effectiveDate = runtimeClosure.effectiveDate;
      const isFuture = effectiveDate > today;
      return {
        ...c,
        status: isFuture ? "Closing" : (runtimeClosure.reason === "non_payment" ? "Terminated" : "Closed"),
        closure: runtimeClosure,
      };
    }
    return c;
  }

  // Build incoming renewal preview from sample3 data when triggered from queue
  const incomingRenewal: IncomingRenewalPreview | undefined = closeIntent === "early-renewal" && queueItemId
    ? {
        queueItemId: queueItemId,
        tcv: extractedSample3.terms.tcv,
        startDate: extractedSample3.terms.startDate,
        endDate: extractedSample3.terms.endDate,
        term: extractedSample3.terms.term,
        minCommit: extractedSample3.terms.minCommit,
        prepaidCredits: extractedSample3.terms.prepaidCredits,
        products: extractedSample3.products.map((p) => ({
          name: p.extractedName,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          discount: p.discount,
        })),
      }
    : undefined;

  function handleContractClosure(closure: ContractClosure) {
    if (!activeContract) return;
    
    setShowClosePane(false);
    
    // Generate IDs for closure-related documents
    const timestamp = Date.now().toString().slice(-4);
    let updatedClosure = { ...closure };
    let approvalDocumentId: string | undefined;
    
    if (closure.settlementType === "credit_note") {
      updatedClosure.creditNoteId = `CN-CLOSE-${timestamp}`;
      approvalDocumentId = updatedClosure.creditNoteId;
      // Submit credit note for approval
      submitInvoiceForApproval(approvalDocumentId, {
        customerId: customer.id,
        customerName: customer.name,
        invoiceAmount: closure.finalAmount,
        invoiceDate: new Date().toISOString().slice(0, 10),
      });
    } else if (closure.settlementType === "termination_charge") {
      updatedClosure.invoiceId = `INV-TERM-${timestamp}`;
      approvalDocumentId = updatedClosure.invoiceId;
      // Submit termination invoice for approval
      submitInvoiceForApproval(approvalDocumentId, {
        customerId: customer.id,
        customerName: customer.name,
        invoiceAmount: closure.finalAmount,
        invoiceDate: new Date().toISOString().slice(0, 10),
      });
    }
    
    applyContractClosure(activeContract.id, updatedClosure);
    
    const settlementText = closure.settlementType === "credit_note"
      ? `Credit note for $${closure.finalAmount.toLocaleString()}`
      : closure.settlementType === "termination_charge"
        ? `Termination charge of $${closure.finalAmount.toLocaleString()}`
        : "No financial impact";
    
    const approvalText = closure.approvalRequired ? " pending approval." : ".";

    if (queueItemId && approvalDocumentId) {
      // Early renewal path — navigate to the approval page with queueItemId context.
      navigate(
        `/approvals/invoices/${approvalDocumentId}?closureFor=${activeContract.id}&queueItemId=${queueItemId}`
      );
    } else if (queueItemId && closure.settlementType === "no_financial_impact") {
      // No financial impact — there's nothing to approve, but we still need to
      // process the renewal. Navigate to the queue item so the user can proceed.
      showClosureToast(`Contract closure initiated. ${settlementText}${approvalText}`, activeContract.id);
      navigate(`/queue/${queueItemId}`);
    } else {
      showClosureToast(`Contract closure initiated. ${settlementText}${approvalText}`, activeContract.id);
    }
  }

  const quoteVersions = activeQuote ? getQuoteLineage(activeQuote.lineageId) : [];

  // Initial invoice: pre-select when deep-linked to a specific invoice
  const initialInvoice: Invoice | undefined =
    activeRecordId && initialStage === "invoicing"
      ? invoicesForListView.find((i) => i.id === activeRecordId)
      : undefined;

  const [activeInvoice, setActiveInvoice] = useState<Invoice | undefined>(initialInvoice);

  // Insight rail: collapsed by default; section open state persists across lifecycle tabs after the user expands.
  const [railSections, setRailSections] = useState(() => ({ ...DEFAULT_INSIGHT_RAIL_SECTIONS }));

  function toggleRailSection(key: InsightRailSectionKey) {
    setRailSections((s) => ({ ...s, [key]: !s[key] }));
  }

  useEffect(() => {
    setActiveQuote(quote);
  }, [quote]);

  // Disabled stages: downstream tabs are locked when no contract / invoices exist yet
  const disabledStages = new Set<Stage>([
    ...(customerContracts.length === 0 ? (["contract", "invoicing", "revrec"] as Stage[]) : []),
    ...(customerInvoicesRaw.length === 0 ? (["payment"] as Stage[]) : []),
  ]);

  const effectiveContract = getEffectiveContract(activeContract ?? contract);

  const collectionCases = getCollectionCasesForCustomer(customer.id);
  const primaryCase = collectionCases[0];
  const revenueArrangement = effectiveContract ? getRevenueArrangement(effectiveContract.id) : undefined;

  const isListStage = LIST_STAGES.includes(activeStage);
  const inListMode = viewMode === "list" && isListStage;

  /** Sticky `RecordHeader` (quote / contract / invoice detail) provides its own shadow — skip context bar stuck shadow. */
  const suppressContextBarStuckShadow =
    !inListMode &&
    Boolean(
      (activeStage === "quote" && !!activeQuote) ||
        (activeStage === "contract" && !!effectiveContract) ||
        (activeStage === "invoicing" && !!activeInvoice && !!effectiveContract),
    );

  // The ID shown in the breadcrumb's record crumb.
  const currentRecordId = inListMode
    ? undefined
    : activeStage === "quote"
    ? activeQuote?.id
    : activeStage === "contract"
    ? effectiveContract?.id
    : activeStage === "invoicing" && activeInvoice
    ? activeInvoice.id
    : activeStage === "payment" && primaryCase
    ? primaryCase.invoiceId
    : activeStage === "revrec" && revenueArrangement
    ? revenueArrangement.id
    : activeRecordId;

  function handleStageChange(stage: Stage) {
    setActiveStage(stage);
    setViewMode("list");
  }

  function handleBackToList() {
    setViewMode("list");
    setActiveInvoice(undefined);
  }

  function renderContent() {
    // List view for applicable stages
    if (viewMode === "list" && isListStage) {
      switch (activeStage) {
        case "quote":
          return (
            <QuoteListView
              quotes={customerQuotes}
              onSelect={(q) => {
                setActiveQuote(q);
                setViewMode("detail");
              }}
            />
          );
        case "contract":
          return (
            <ContractListView
              contracts={contractsForListView}
              onSelect={(c) => {
                setActiveContract(c);
                setViewMode("detail");
              }}
            />
          );
        case "invoicing":
          return (
            <InvoiceListView
              invoices={invoicesForListView}
              onSelect={(inv) => {
                setActiveInvoice(inv);
                setViewMode("detail");
              }}
            />
          );
      }
    }

    switch (activeStage) {
      case "customer":
        return <CustomerStageContent customer={customer} />;
      case "quote":
        return activeQuote ? (
          <QuoteStageContent
            quote={activeQuote}
            quoteVersions={quoteVersions}
            onQuoteVersionChange={setActiveQuote}
            onBack={handleBackToList}
          />
        ) : (
          <EmptyState message="No quote selected." />
        );
      case "contract": {
        return effectiveContract ? (
          <ContractStageContent
            contract={effectiveContract}
            onBack={handleBackToList}
            onOpenClosePane={() => setShowClosePane(true)}
          />
        ) : (
          <EmptyState message="No contract found for this customer." />
        );
      }
      case "invoicing":
        return activeInvoice && effectiveContract ? (
          <InvoicingStageContent invoice={activeInvoice} contract={effectiveContract} onBack={handleBackToList} />
        ) : null;
      case "payment":
        return <PaymentStageContent customer={customer} />;
      case "revrec":
        return effectiveContract ? <RevRecStageContent contract={effectiveContract} /> : null;
      default:
        return null;
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <CustomerContextBar
        customer={customer}
        quote={activeQuote}
        contract={effectiveContract}
        invoice={activeInvoice}
        arrangement={revenueArrangement}
        activeStage={activeStage}
        onStageChange={handleStageChange}
        disabledStages={disabledStages}
        from={from}
        recordId={currentRecordId}
        suppressStuckShadow={suppressContextBarStuckShadow}
      />

      {/* Main content — always rendered */}
      <div className="flex-1 px-6 pt-4 pb-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>{renderContent()}</div>
          <InsightRail
            tasks={tasks}
            customer={customer}
            sections={railSections}
            onSectionToggle={toggleRailSection}
          />
        </div>
      </div>

      {/* Close contract modal — full page overlay with padding on top/left/right */}
      {showClosePane && effectiveContract && (
        <div className="fixed inset-0 z-50 pt-2 pl-2 pr-2">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/10" />
          {/* Modal card */}
          <div className="relative h-full rounded-t-xl bg-white shadow-xl overflow-hidden flex flex-col">
            <CloseContractPane
              contract={effectiveContract}
              onDiscard={() => setShowClosePane(false)}
              onConfirm={handleContractClosure}
              fromQueueItemId={queueItemId}
              incomingRenewal={incomingRenewal}
            />
          </div>
        </div>
      )}

      {/* Closure toast */}
      {closureToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
            <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            <p className="text-[13px] font-medium text-emerald-800">{closureToast.message}</p>
          </div>
        </div>
      )}

      {/* Renewal scheduled toast (blue) */}
      {renewalToast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 shadow-lg">
            <CheckCircle2 size={18} className="shrink-0 text-blue-600" />
            <p className="text-[13px] font-medium text-blue-800">{renewalToast.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-muted px-6 py-10 text-center text-[13px] text-text-muted">
      {message}
    </div>
  );
}
