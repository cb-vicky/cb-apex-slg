import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { Customer, Quote, Contract, Invoice, Task, ContractClosure } from "@/data/mock-data";
import { getInvoices, getQuoteLineage, getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { extractedSample3 } from "@/data/ingest-data";
import { getCollectionCasesForCustomer } from "@/data/billing-data";
import { getRevenueArrangement } from "@/data/revrec-data";
import { useIngestContext } from "@/context/IngestContext";
import { useWorkspaceShell } from "@/context/WorkspaceShellContext";
import { openDrawer } from "@/store/drawer-store";
import { CustomerContextBar } from "./CustomerContextBar";
import { type Stage } from "./RevenueJourneyRail";
import { QuoteStageContent } from "./quote/QuoteStageContent";
import { ContractStageContent } from "./contract/ContractStageContent";
import { CustomerStageContent } from "./customer/CustomerStageContent";
import { InvoicingStageContent } from "./invoicing/InvoicingStageContent";
import { PaymentStageContent } from "./payment/PaymentStageContent";
import { RevRecStageContent } from "./revrec/RevRecStageContent";
import { QuoteListView } from "./quote/QuoteListView";
import { ContractListView, type PendingIngestionContract } from "./contract/ContractListView";
import { InvoiceListView } from "./invoicing/InvoiceListView";
import { CloseContractPane } from "@/components/contracts/CloseContractPane";
import type { IncomingRenewalPreview } from "@/components/contracts/CloseContractPane";
import { mergeContractsWithRuntimeClosures } from "./derive-stage-data";
import { RecordSlotContext } from "./RecordSlot";
import { cn } from "@/lib/utils";

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
  const { setCustomer360Active } = useWorkspaceShell();
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
    contractGraceExtensions,
    sessionInvoices,
    queueItems,
  } = useIngestContext();

  useEffect(() => {
    setCustomer360Active(true);
    return () => setCustomer360Active(false);
  }, [setCustomer360Active]);

  // When closeIntent is present, force list mode (so user sees context before pane opens)
  const [viewMode, setViewMode] = useState<"list" | "detail">(
    closeIntent ? "list" : activeRecordId ? "detail" : "list",
  );

  const [activeQuote, setActiveQuote] = useState<Quote | null>(quote);
  const [activeContract, setActiveContract] = useState<Contract | null>(contract);
  const [showClosePane, setShowClosePane] = useState(false);

  const customerQuotes = getQuotesForCustomer(customer.id);
  // Merge runtime session contracts so auto-ingested Scheduled renewals appear
  const customerContracts = useMemo(() => {
    const seedContracts = getContractsForCustomer(customer.id);
    const sessionContractsForCustomer = sessionContracts.filter((c) => c.customerId === customer.id);
    return [
      ...seedContracts,
      ...sessionContractsForCustomer.filter((c) => !seedContracts.some((s) => s.id === c.id)),
    ];
  }, [customer.id, sessionContracts]);

  /** List + rail + detail: session overlays (closure, grace) so every surface matches IngestContext. */
  const contractsForListView = useMemo(
    () => mergeContractsWithRuntimeClosures(customerContracts, contractClosures, contractGraceExtensions),
    [customerContracts, contractClosures, contractGraceExtensions],
  );

  /** Pending ingestion contracts from queue items (Early/Late Renewal scenarios for this customer). */
  const pendingIngestionContracts = useMemo<PendingIngestionContract[]>(() => {
    const isPendingStatus = (status: string) =>
      status === "Pending Review" ||
      status === "In Progress" ||
      status === "Invoice review" ||
      status === "Returned";

    return queueItems
      .filter(
        (q) =>
          q.customerId === customer.id &&
          (q.scenario === "Early Renewal" || q.scenario === "Late Renewal") &&
          isPendingStatus(q.status)
      )
      .map((q) => ({
        queueItemId: q.id,
        documentName: q.documentName,
        customerName: q.customerName,
        tcv: q.tcv,
        uploadedAt: q.uploadedAt,
        scenario: q.scenario,
        status: q.status,
        activeContractId: q.activeContractId,
      }));
  }, [queueItems, customer.id]);

  const customerInvoicesRaw = useMemo(() => {
    const seed = getInvoices(customer.id);
    const extra = sessionInvoices.filter((i) => i.customerId === customer.id);
    return [
      ...seed,
      ...extra.filter((e) => !seed.some((s) => s.id === e.id)),
    ];
  }, [customer.id, sessionInvoices]);

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
    let approvalDocumentId: string | undefined;

    const updatedClosure: ContractClosure =
      closure.settlementType === "credit_note"
        ? (() => {
            const creditNoteId = `CN-CLOSE-${timestamp}`;
            approvalDocumentId = creditNoteId;
            submitInvoiceForApproval(creditNoteId, {
              customerId: customer.id,
              customerName: customer.name,
              invoiceAmount: closure.finalAmount,
              invoiceDate: new Date().toISOString().slice(0, 10),
            });
            return { ...closure, creditNoteId };
          })()
        : closure.settlementType === "termination_charge"
          ? (() => {
              const invoiceId = `INV-TERM-${timestamp}`;
              approvalDocumentId = invoiceId;
              submitInvoiceForApproval(invoiceId, {
                customerId: customer.id,
                customerName: customer.name,
                invoiceAmount: closure.finalAmount,
                invoiceDate: new Date().toISOString().slice(0, 10),
              });
              return { ...closure, invoiceId };
            })()
          : { ...closure };

    applyContractClosure(activeContract.id, updatedClosure);
    
    const settlementText = closure.settlementType === "credit_note"
      ? `Credit note for $${closure.finalAmount.toLocaleString()}`
      : closure.settlementType === "termination_charge"
        ? `Termination charge of $${closure.finalAmount.toLocaleString()}`
        : "No financial impact";
    
    const approvalText = closure.approvalRequired ? " pending approval." : ".";

    if (queueItemId && approvalDocumentId) {
      openDrawer({
        entityType: "invoice",
        mode: "invoice_approval",
        entityId: approvalDocumentId,
        context: { queueItemId },
      });
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

  useEffect(() => {
    setActiveQuote(quote);
  }, [quote]);

  // Keep selected contract aligned when the shell resolves a different record (URL / alias route).
  useEffect(() => {
    setActiveContract(contract);
  }, [contract?.id, contract]);

  // Disabled stages: downstream tabs are locked when no contract / invoices exist yet
  const disabledStages = new Set<Stage>([
    ...(customerContracts.length === 0 ? (["contract", "invoicing", "revrec"] as Stage[]) : []),
    ...(customerInvoicesRaw.length === 0 ? (["payment"] as Stage[]) : []),
  ]);

  const selectedContractId = (activeContract ?? contract)?.id ?? null;
  const effectiveContract = useMemo(() => {
    if (!selectedContractId) return null;
    return contractsForListView.find((c) => c.id === selectedContractId) ?? null;
  }, [contractsForListView, selectedContractId]);

  const effectiveInvoice = useMemo(() => {
    if (!activeInvoice?.id) return undefined;
    return invoicesForListView.find((i) => i.id === activeInvoice.id) ?? activeInvoice;
  }, [activeInvoice, invoicesForListView]);

  // Auto-open close pane when triggered from queue flow with early-renewal intent (use merged status).
  useEffect(() => {
    if (closeIntent === "early-renewal" && effectiveContract?.status === "Active") {
      setShowClosePane(true);
    }
  }, [closeIntent, effectiveContract?.status]);

  const collectionCases = getCollectionCasesForCustomer(customer.id);
  const primaryCase = collectionCases[0];
  const revenueArrangement = effectiveContract ? getRevenueArrangement(effectiveContract.id) : undefined;

  const isListStage = LIST_STAGES.includes(activeStage);
  const inListMode = viewMode === "list" && isListStage;

  // Stages that present a per-record bar (the glass card under the tabs).
  // Customer/Payment/RevRec don't have list-then-detail or a record context bar.
  const hasRecordBar =
    !inListMode &&
    Boolean(
      (activeStage === "quote" && !!activeQuote) ||
        (activeStage === "contract" && !!effectiveContract) ||
        (activeStage === "invoicing" && !!effectiveInvoice && !!effectiveContract),
    );

  const [recordSlotEl, setRecordSlotEl] = useState<HTMLDivElement | null>(null);

  // The ID shown in the breadcrumb's record crumb.
  const currentRecordId = inListMode
    ? undefined
    : activeStage === "quote"
    ? activeQuote?.id
    : activeStage === "contract"
    ? effectiveContract?.id
    : activeStage === "invoicing" && effectiveInvoice
    ? effectiveInvoice.id
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
              pendingIngestions={pendingIngestionContracts}
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
        const graceExt = effectiveContract ? contractGraceExtensions[effectiveContract.id] : undefined;
        return effectiveContract ? (
          <ContractStageContent
            contract={effectiveContract}
            graceExtension={graceExt}
            customerContracts={contractsForListView}
            onContractSelect={(id) => {
              const next = contractsForListView.find((c) => c.id === id);
              if (next) setActiveContract(next);
            }}
            onBack={handleBackToList}
            onOpenClosePane={() => setShowClosePane(true)}
          />
        ) : (
          <EmptyState message="No contract found for this customer." />
        );
      }
      case "invoicing":
        return effectiveInvoice && effectiveContract ? (
          <InvoicingStageContent
            invoice={effectiveInvoice}
            contract={effectiveContract}
            customerInvoices={invoicesForListView}
            onInvoiceSelect={(id) => {
              const next = invoicesForListView.find((i) => i.id === id);
              if (next) setActiveInvoice(next);
            }}
            onBack={handleBackToList}
          />
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
    <div className="flex flex-1 flex-col bg-gray-100">
      <CustomerContextBar
        customer={customer}
        quote={activeQuote}
        contract={effectiveContract}
        invoice={effectiveInvoice}
        arrangement={revenueArrangement}
        activeStage={activeStage}
        onStageChange={handleStageChange}
        disabledStages={disabledStages}
        from={from}
        recordId={currentRecordId}
        recordSlot={hasRecordBar ? <div ref={setRecordSlotEl} /> : null}
      />

      {/* Main content area — light grey bg, content cards centered.
          Detail content reads at max-w-860; list views (Quotes / Contracts /
          Invoicing tables) get a wider 1020px column so columns aren't
          cramped. */}
      <RecordSlotContext.Provider value={recordSlotEl}>
        <div
          data-workspace-content
          className="relative flex-1 transition-[padding] duration-200 ease-out"
        >
          <div
            className={cn(
              "mx-auto px-6 pt-2 pb-12",
              inListMode ? "max-w-[1020px]" : "max-w-[860px]",
            )}
          >
            {renderContent()}
          </div>
        </div>
      </RecordSlotContext.Provider>

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
    <div className="rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center text-[14px] text-text-muted">
      {message}
    </div>
  );
}
