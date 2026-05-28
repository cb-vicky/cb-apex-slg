import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import type { Customer, Quote, Contract, Invoice, Task, ContractClosure } from "@/data/mock-data";
import { getInvoices, getQuoteLineage, getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { getCollectionCasesForCustomer, getPromiseToPayForCustomer } from "@/data/billing-data";
import { getRevenueArrangement } from "@/data/revrec-data";
import { useIngestContext } from "@/context/IngestContext";
import { useWorkspaceShell } from "@/context/WorkspaceShellContext";
import { openDrawer } from "@/store/drawer-store";
import { CustomerContextBar } from "./CustomerContextBar";
import { buildRecordTabSummaries, deriveParentTabSummaries } from "./derive-tab-summaries";
import type { Stage } from "./stage";
import {
  isListDetailStage,
  isListMode,
  isRecordDetail,
  type ListDetailStage,
  type OpenRecordTab,
  type WorkspaceTab,
} from "./workspace-tabs";
import { QuoteStageContent } from "./quote/QuoteStageContent";
import { ContractStageContent } from "./contract/ContractStageContent";
import { CustomerStageContent } from "./customer/CustomerStageContent";
import { InvoicingStageContent } from "./invoicing/InvoicingStageContent";
import { PaymentStageContent } from "./payment/PaymentStageContent";
import {
  PaymentCollectionsChromeProvider,
  type PaymentCollectionsTab,
} from "./payment/PaymentCollectionsChromeContext";
import { RevRecStageContent } from "./revrec/RevRecStageContent";
import { TasksStageContent } from "./tasks/TasksStageContent";
import { ThreadsStageContent } from "./threads/ThreadsStageContent";
import type { CustomerTask } from "@/data/customer-tasks";
import { QuoteListView } from "./quote/QuoteListView";
import { ContractListView, type PendingIngestionContract } from "./contract/ContractListView";
import { InvoiceListView } from "./invoicing/InvoiceListView";
import { CloseContractPane, type IncomingRenewalPreview } from "@/components/contracts/CloseContractPane";
import { mergeContractsWithRuntimeClosures } from "./derive-stage-data";
import { extractedSample3 } from "@/data/ingest-data";
import { RecordSlotContext } from "./RecordSlot";
import { WorkspaceDetailNav } from "./WorkspaceDetailNav";
import { getDetailNavItems } from "./workspace-detail-nav";
import { cn } from "@/lib/utils";
import { useIsXl } from "@/lib/useIsXl";

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
  tasks: _tasks,
  initialStage,
  from,
  activeRecordId,
  closeIntent,
  queueItemId,
}: Props) {
  void _tasks;
  const navigate = useNavigate();
  const { setCustomer360Active } = useWorkspaceShell();
  const isXl = useIsXl();
  const initialActiveTab: WorkspaceTab = useMemo(() => {
    if (closeIntent) return { kind: "parent", stage: "contract" };
    if (activeRecordId && isListDetailStage(initialStage)) {
      return { kind: "record", stage: initialStage, recordId: activeRecordId };
    }
    return { kind: "parent", stage: initialStage };
  }, [closeIntent, initialStage, activeRecordId]);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialActiveTab);
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

  const [activeQuote, setActiveQuote] = useState<Quote | null>(quote);
  const [activeContract, setActiveContract] = useState<Contract | null>(contract);
  const [showClosePane, setShowClosePane] = useState(false);

  const [hiddenParentStages, setHiddenParentStages] = useState<Set<Stage>>(new Set());
  const [paymentCollectionsTab, setPaymentCollectionsTab] =
    useState<PaymentCollectionsTab>("overview");
  const [paymentSubTabsDocked, setPaymentSubTabsDocked] = useState(false);
  const [openRecordTabs, setOpenRecordTabs] = useState<OpenRecordTab[]>(() => {
    const stage = closeIntent ? "contract" : initialStage;
    if (activeRecordId && isListDetailStage(stage)) {
      return [{ stage, recordId: activeRecordId }];
    }
    return [];
  });

  const activeStage: Stage =
    activeTab.kind === "parent" ? activeTab.stage : activeTab.stage;

  useEffect(() => {
    if (activeStage !== "payment") {
      setPaymentSubTabsDocked(false);
    }
  }, [activeStage]);

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
  const inListMode = isListMode(activeTab);

  const detailNavItems = useMemo(() => {
    if (inListMode) return [];
    return getDetailNavItems({
      stage: activeStage,
      customer,
      quote: activeQuote,
      contract: effectiveContract,
      quotes: customerQuotes,
      contracts: contractsForListView,
    });
  }, [
    inListMode,
    activeStage,
    customer,
    activeQuote,
    effectiveContract,
    customerQuotes,
    contractsForListView,
  ]);

  const hasRecordBar =
    isRecordDetail(activeTab) &&
    Boolean(
      (activeTab.stage === "quote" && !!activeQuote) ||
        (activeTab.stage === "contract" && !!effectiveContract) ||
        (activeTab.stage === "invoicing" && !!effectiveInvoice && !!effectiveContract),
    );

  const [recordSlotEl, setRecordSlotEl] = useState<HTMLDivElement | null>(null);

  const currentRecordId = inListMode
    ? undefined
    : activeTab.kind === "record"
      ? activeTab.recordId
      : activeStage === "payment" && primaryCase
        ? primaryCase.invoiceId
        : activeStage === "revrec" && revenueArrangement
          ? revenueArrangement.id
          : undefined;

  function syncRecordForTab(tab: WorkspaceTab) {
    if (tab.kind !== "record") return;
    if (tab.stage === "quote") {
      const q = customerQuotes.find((q) => q.id === tab.recordId);
      if (q) setActiveQuote(q);
    } else if (tab.stage === "contract") {
      const c = contractsForListView.find((c) => c.id === tab.recordId);
      if (c) setActiveContract(c);
    } else if (tab.stage === "invoicing") {
      const inv = invoicesForListView.find((i) => i.id === tab.recordId);
      if (inv) setActiveInvoice(inv);
    }
  }

  function handleTabSelect(tab: WorkspaceTab) {
    setActiveTab(tab);
    syncRecordForTab(tab);
  }

  function openRecordTab(stage: ListDetailStage, recordId: string) {
    setOpenRecordTabs((prev) => {
      if (prev.some((r) => r.stage === stage && r.recordId === recordId)) return prev;
      return [...prev, { stage, recordId }];
    });
    const tab: WorkspaceTab = { kind: "record", stage, recordId };
    setActiveTab(tab);
    syncRecordForTab(tab);
  }

  function handleParentClose(stage: Stage) {
    if (stage === "customer") return;
    setHiddenParentStages((prev) => new Set([...prev, stage]));
    if (activeTab.kind === "parent" && activeTab.stage === stage) {
      setActiveTab({ kind: "parent", stage: "customer" });
    }
  }

  function handleRestoreParent(stage: Stage) {
    setHiddenParentStages((prev) => {
      const next = new Set(prev);
      next.delete(stage);
      return next;
    });
    setActiveTab({ kind: "parent", stage });
  }

  function handleRecordClose(stage: ListDetailStage, recordId: string) {
    const closingActive =
      activeTab.kind === "record" &&
      activeTab.stage === stage &&
      activeTab.recordId === recordId;

    setOpenRecordTabs((prev) => {
      const next = prev.filter((r) => !(r.stage === stage && r.recordId === recordId));
      if (closingActive) {
        const sameStage = next.filter((r) => r.stage === stage);
        if (sameStage.length > 0) {
          const last = sameStage[sameStage.length - 1];
          const tab: WorkspaceTab = { kind: "record", stage, recordId: last.recordId };
          setActiveTab(tab);
          syncRecordForTab(tab);
        } else if (!hiddenParentStages.has(stage)) {
          setActiveTab({ kind: "parent", stage });
        } else {
          setActiveTab({ kind: "parent", stage: "customer" });
        }
      }
      return next;
    });
  }

  function renderContent() {
    if (inListMode && isListStage) {
      switch (activeStage) {
        case "quote":
          return (
            <QuoteListView
              quotes={customerQuotes}
              onSelect={(q) => {
                setActiveQuote(q);
                openRecordTab("quote", q.id);
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
                openRecordTab("contract", c.id);
              }}
            />
          );
        case "invoicing":
          return (
            <InvoiceListView
              invoices={invoicesForListView}
              onSelect={(inv) => {
                setActiveInvoice(inv);
                openRecordTab("invoicing", inv.id);
              }}
            />
          );
      }
    }

    switch (activeStage) {
      case "customer":
        return <CustomerStageContent customer={customer} />;
      case "tasks":
        return <TasksStageContent customer={customer} onTaskClick={handleTaskClick} />;
      case "threads":
        return <ThreadsStageContent customer={customer} />;
      case "quote":
        return activeQuote ? (
          <QuoteStageContent quote={activeQuote} quoteVersions={quoteVersions} />
        ) : (
          <EmptyState message="No quote selected." />
        );
      case "contract": {
        const graceExt = effectiveContract ? contractGraceExtensions[effectiveContract.id] : undefined;
        return effectiveContract ? (
          <ContractStageContent
            contract={effectiveContract}
            graceExtension={graceExt}
            onOpenClosePane={() => setShowClosePane(true)}
          />
        ) : (
          <EmptyState message="No contract found for this customer." />
        );
      }
      case "invoicing":
        return effectiveInvoice && effectiveContract ? (
          <InvoicingStageContent invoice={effectiveInvoice} contract={effectiveContract} />
        ) : null;
      case "payment":
        return <PaymentStageContent customer={customer} />;
      case "revrec":
        return effectiveContract ? <RevRecStageContent contract={effectiveContract} /> : null;
      default:
        return null;
    }
  }

  const parentTabSummaries = useMemo(
    () =>
      deriveParentTabSummaries({
        customer,
        quotes: customerQuotes,
        contracts: contractsForListView,
        invoices: invoicesForListView,
        invoiceStatusOverrides,
        contractClosures,
        contractGraceExtensions,
        primaryContractId: effectiveContract?.id ?? null,
      }),
    [
      customer,
      customerQuotes,
      contractsForListView,
      invoicesForListView,
      invoiceStatusOverrides,
      contractClosures,
      contractGraceExtensions,
      effectiveContract?.id,
    ],
  );

  const recordTabSummaries = useMemo(
    () =>
      buildRecordTabSummaries({
        quotes: customerQuotes,
        contracts: contractsForListView,
        invoices: invoicesForListView,
        invoiceStatusOverrides,
      }),
    [customerQuotes, contractsForListView, invoicesForListView, invoiceStatusOverrides],
  );

  function handleTaskClick(task: CustomerTask) {
    if (task.action?.stage) {
      setActiveTab({ kind: "parent", stage: task.action.stage });
    }
    // TODO: Open drawer if task.action?.drawer is set
    // For now, just switch tabs. Drawer integration can be added later.
  }

  const paymentChromeValue = useMemo(
    () => ({
      collectionsTab: paymentCollectionsTab,
      setCollectionsTab: setPaymentCollectionsTab,
      promiseToPayCount: getPromiseToPayForCustomer(customer.id).length,
      subTabsDocked: paymentSubTabsDocked,
      setSubTabsDocked: setPaymentSubTabsDocked,
    }),
    [paymentCollectionsTab, paymentSubTabsDocked, customer.id],
  );

  return (
    <PaymentCollectionsChromeProvider value={paymentChromeValue}>
    <div className="flex flex-1 flex-col bg-gray-100">
      <CustomerContextBar
        customer={customer}
        activeTab={activeTab}
        hiddenParentStages={hiddenParentStages}
        openRecordTabs={openRecordTabs}
        disabledStages={disabledStages}
        from={from}
        recordId={currentRecordId}
        onTabSelect={handleTabSelect}
        onParentClose={handleParentClose}
        onRecordClose={handleRecordClose}
        onRestoreParent={handleRestoreParent}
        parentTabSummaries={parentTabSummaries}
        recordTabSummaries={recordTabSummaries}
        recordSlot={hasRecordBar ? <div ref={setRecordSlotEl} /> : null}
      />

      {/* Detail nav: Notion-style line rail on all detail views (xl+). */}
      <RecordSlotContext.Provider value={recordSlotEl}>
        <div
          data-workspace-content
          className="relative flex-1 transition-[padding] duration-200 ease-out"
        >
          <div
            className={cn(
              "grid min-w-0 px-6 pt-2 pb-12",
              inListMode
                ? "grid-cols-[1fr_minmax(0,min(1020px,100%))_1fr]"
                : "grid-cols-[1fr_minmax(0,min(860px,100%))_1fr]",
            )}
          >
            {!inListMode && isXl && detailNavItems.length > 0 ? (
              <div className="col-start-1 row-start-1 hidden justify-self-end pr-4 xl:block">
                <WorkspaceDetailNav items={detailNavItems} variant="notion" />
              </div>
            ) : null}
            <div className="col-start-2 row-start-1 min-w-0">{renderContent()}</div>
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
    </PaymentCollectionsChromeProvider>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-muted px-6 py-12 text-center text-[14px] text-text-muted">
      {message}
    </div>
  );
}
