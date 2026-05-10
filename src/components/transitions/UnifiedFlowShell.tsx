import { useState, useMemo, useCallback, useEffect } from "react";
import { Check, Lock, X, Sparkles } from "lucide-react";
import { useDrawerStore } from "@/store/useDrawerStore";
import { patchFlowSession } from "@/store/drawer-store";
import { IngestDrawer } from "@/components/transitions/IngestDrawer";
import { InvoiceReviewStep } from "@/components/transitions/InvoiceReviewStep";
import { InvoiceApprovalDrawer } from "@/components/approvals/InvoiceApprovalDrawer";
import { EarlyRenewalClosePriorStep } from "@/components/transitions/EarlyRenewalClosePriorStep";
import { ExtendGraceStep } from "@/components/transitions/ExtendGraceStep";
import { ApprovalSettingsStep } from "@/components/transitions/ApprovalSettingsStep";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { UnifiedDrawerChromeProvider, useUnifiedDrawerChrome } from "@/context/UnifiedDrawerChromeContext";
import { useIngestContext } from "@/context/IngestContext";
import { customers, contracts as allContracts, invoices as allInvoices, getQuotesForCustomer } from "@/data/mock-data";
import type { FlowStepId, TransitionFlowSession } from "@/data/contract-transition";
import { cn } from "@/lib/utils";
import { CustomerStageContent } from "@/components/revenue-workspace/customer/CustomerStageContent";
import { QuoteListView } from "@/components/revenue-workspace/quote/QuoteListView";
import { QuoteStageContent } from "@/components/revenue-workspace/quote/QuoteStageContent";
import { ContractListView, type PendingIngestionContract } from "@/components/revenue-workspace/contract/ContractListView";
import { ContractStageContent } from "@/components/revenue-workspace/contract/ContractStageContent";
import { InvoiceListView } from "@/components/revenue-workspace/invoicing/InvoiceListView";
import { InvoicingStageContent } from "@/components/revenue-workspace/invoicing/InvoicingStageContent";
import type { Quote, Invoice } from "@/data/mock-data";

type LifecycleStage = "customer" | "quote" | "contract" | "invoicing" | "payment" | "revrec";

const LIFECYCLE_TABS: { id: LifecycleStage; label: string }[] = [
  { id: "customer", label: "Overview" },
  { id: "quote", label: "Quotes" },
  { id: "contract", label: "Contracts" },
  { id: "invoicing", label: "Invoicing" },
  { id: "payment", label: "Collections" },
  { id: "revrec", label: "RevRec" },
];

type StepDef = { id: FlowStepId; label: string; short: string };

function buildIngestInvoiceSteps(queueScenario?: string): StepDef[] {
  if (queueScenario === "Early Renewal" || queueScenario === "Late Renewal") {
    return [
      { id: "ingest", label: "Contract extraction", short: "1" },
      { id: "close_prior", label: "Close prior", short: "2" },
      { id: "invoice_review", label: "Invoice review", short: "3" },
      { id: "approval_settings", label: "Approval settings", short: "4" },
    ];
  }
  return [
    { id: "ingest", label: "Contract extraction", short: "1" },
    { id: "invoice_review", label: "Invoice review", short: "2" },
    { id: "approval_settings", label: "Approval settings", short: "3" },
  ];
}

const LATE_GRACE_STEPS: StepDef[] = [
  { id: "grace_extend", label: "Extend grace", short: "1" },
  { id: "approval_settings", label: "Approval settings", short: "2" },
];

function stepRank(step: FlowStepId, ordered: StepDef[]): number {
  const i = ordered.findIndex((s) => s.id === step);
  return i;
}

function UnifiedFlowShellHeader({
  onClose,
  customerName,
  activeFlow,
  orderedSteps,
  furthestRank,
  goStep,
  showStepper,
  queueScenario,
}: {
  onClose: () => void;
  customerName?: string;
  activeFlow?: TransitionFlowSession;
  orderedSteps: StepDef[];
  furthestRank: number;
  goStep: (id: FlowStepId) => void;
  showStepper: boolean;
  queueScenario?: string;
}) {
  const { trailingActions } = useUnifiedDrawerChrome();
  const currentRank = activeFlow ? stepRank(activeFlow.step, orderedSteps) : -1;

  const isNewDeal = queueScenario === "New Business";
  const processTag = queueScenario === "Early Renewal" 
    ? "Early Renewal" 
    : queueScenario === "Late Renewal" 
      ? "Late Renewal" 
      : null;

  return (
    <header className="shrink-0 border-b border-gray-100 bg-white px-4 py-3">
      <div className="flex h-9 items-center gap-3">
        {/* Left section - close button and customer name */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          <div className="flex flex-col">
            <h1 className="truncate text-[16px] font-semibold text-text-primary">
              {isNewDeal ? "New Contract" : (customerName ?? "Customer")}
            </h1>
            {processTag && !isNewDeal && (
              <span className="text-[11px] font-medium text-blue-600">
                {processTag}
              </span>
            )}
          </div>
        </div>

        {/* Center section - Stepper (always takes flex-1 to maintain layout) */}
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
          {showStepper && activeFlow && currentRank >= 0 && orderedSteps.map((s, idx) => {
            const stepRankVal = stepRank(s.id, orderedSteps);
            const active = activeFlow.step === s.id;
            const completed = currentRank > stepRankVal;
            const lockedForward = stepRankVal > furthestRank;
            const clickable = !lockedForward;

            return (
              <div key={s.id} className="flex min-w-0 items-center">
                {idx > 0 ? (
                  <div
                    className={cn(
                      "mx-1 h-px w-4 shrink-0",
                      completed ? "bg-emerald-500/60" : "bg-gray-300",
                    )}
                    aria-hidden
                  />
                ) : null}
                <button
                  type="button"
                  disabled={!clickable}
                  onClick={() => goStep(s.id)}
                  title={lockedForward ? "Complete the previous step first" : `Go to ${s.label}`}
                  className={cn(
                    "group flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
                    clickable && "hover:bg-gray-50",
                    !clickable && "cursor-not-allowed opacity-40",
                    active && "bg-gray-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors",
                      active && "bg-blue-600 text-white",
                      !active && completed && "bg-emerald-500 text-white",
                      !active && !completed && !lockedForward && "border border-gray-300 bg-white text-text-muted",
                      lockedForward && "border border-dashed border-gray-300 bg-gray-100 text-text-muted",
                    )}
                  >
                    {lockedForward ? (
                      <Lock size={10} strokeWidth={2.5} className="opacity-60" aria-hidden />
                    ) : completed ? (
                      <Check size={11} strokeWidth={2.75} aria-hidden />
                    ) : (
                      <span aria-hidden>{s.short}</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "truncate text-[13px]",
                      active ? "font-semibold text-text-primary" : "font-medium text-text-secondary",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Right section - Action buttons (fixed width to prevent layout shift) */}
        <div className="flex shrink-0 items-center gap-2 min-w-[120px] justify-end">
          {trailingActions}
        </div>
      </div>
    </header>
  );
}

function LifecycleTabBar({
  activeStage,
  onStageChange,
  flowStep,
  disabledStages,
}: {
  activeStage: LifecycleStage;
  onStageChange: (stage: LifecycleStage) => void;
  flowStep: FlowStepId;
  disabledStages?: Set<LifecycleStage>;
}) {
  return (
    <div className="sticky top-0 z-20 bg-transparent">
      <div className="flex items-stretch">
        {LIFECYCLE_TABS.map((tab, idx) => {
          const isActive = tab.id === activeStage;
          const isDisabled = disabledStages?.has(tab.id) ?? false;
          const isFlowNativeTab = 
            (tab.id === "contract" && flowStep !== "invoice_review" && flowStep !== "approval_settings") ||
            (tab.id === "invoicing" && (flowStep === "invoice_review" || flowStep === "approval_settings"));
          const isFirst = idx === 0;
          const isLast = idx === LIFECYCLE_TABS.length - 1;
          
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !isDisabled && onStageChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                "group relative inline-flex flex-1 items-center justify-center gap-1.5",
                "rounded-b-2xl rounded-t-none px-4 py-2.5 text-[13px] transition-all",
                "border-b border-r",
                isFirst && "border-l",
                isLast && "!border-r-0",
                isActive
                  ? "z-[1] border-gray-200 bg-white font-semibold text-text-primary shadow-[0_4px_12px_-4px_rgba(0,0,0,0.15)]"
                  : isDisabled
                  ? "cursor-not-allowed border-gray-200 bg-[#F3F4F6] text-text-muted/60"
                  : "border-gray-200 bg-[#F3F4F6] font-medium text-blue-600 hover:border-gray-300 hover:bg-gray-200",
              )}
            >
              {isFlowNativeTab && !isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}


function UnifiedFlowShellInner({ onClose }: { onClose: () => void }) {
  const { flow, entityType, entityId, context } = useDrawerStore();
  const { persona } = useDemoPersona();
  const { queueItems, sessionCustomers, sessionContracts } = useIngestContext();

  const [lifecycleStage, setLifecycleStage] = useState<LifecycleStage>("contract");
  const [showCelebration, setShowCelebration] = useState(false);
  const [showContractsList, setShowContractsList] = useState(false);
  
  // Quote detail state
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // Invoice detail state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  
  // Contract detail state (for viewing contracts from "All contracts" list)
  const [selectedContract, setSelectedContract] = useState<typeof allContracts[0] | null>(null);

  // Sync lifecycle stage with flow step changes
  useEffect(() => {
    if (flow?.step === "invoice_review" || flow?.step === "approval_settings") {
      setLifecycleStage("invoicing");
    } else if (flow?.step === "ingest" || flow?.step === "close_prior" || flow?.step === "grace_extend") {
      setLifecycleStage("contract");
    }
  }, [flow?.step]);

  if (!flow) return null;

  const activeFlow = flow;

  const queueId =
    flow.queueItemId ?? (entityType === "queue_item" ? entityId : undefined) ?? context?.queueItemId;
  const invoiceId =
    flow.invoiceId ?? (entityType === "invoice" ? entityId : undefined) ?? undefined;

  const queueItem = queueId ? queueItems.find((q) => q.id === queueId) : undefined;
  const customerId = flow.customerId ?? context?.customerId ?? queueItem?.customerId;
  
  const customer = useMemo(() => {
    if (!customerId) return undefined;
    const sessionCustomer = sessionCustomers.find((c) => c.id === customerId);
    if (sessionCustomer) return sessionCustomer;
    return customers.find((c) => c.id === customerId);
  }, [customerId, sessionCustomers]);

  const customerQuotes = useMemo(() => {
    if (!customerId) return [];
    return getQuotesForCustomer(customerId);
  }, [customerId]);

  const customerContracts = useMemo(() => {
    if (!customerId) return [];
    const fromSession = sessionContracts.filter((c) => c.customerId === customerId);
    const fromMock = allContracts.filter((c) => c.customerId === customerId);
    const ids = new Set(fromSession.map((c) => c.id));
    return [...fromSession, ...fromMock.filter((c) => !ids.has(c.id))];
  }, [customerId, sessionContracts]);

  const customerInvoices = useMemo(() => {
    if (!customerId) return [];
    return allInvoices.filter((inv) => inv.customerId === customerId);
  }, [customerId]);

  const pendingIngestions = useMemo<PendingIngestionContract[]>(() => {
    if (!customerId) return [];
    return queueItems
      .filter((q) => q.customerId === customerId && q.status !== "Ingested")
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
  }, [customerId, queueItems]);

  const ingestSteps = buildIngestInvoiceSteps(queueItem?.scenario);
  const latePhase = context?.latePhase;

  const orderedSteps: StepDef[] =
    activeFlow.scenario === "late_grace"
      ? LATE_GRACE_STEPS.map((s) =>
          s.id === "grace_extend" && latePhase === "resolve"
            ? { ...s, label: "Resolve grace" }
            : s,
        )
      : activeFlow.scenario === "ingest_invoice"
        ? ingestSteps
        : [];

  const furthestStep = activeFlow.furthestUnlockedStep ?? orderedSteps[0]?.id ?? "ingest";
  const rawFurthestRank = orderedSteps.length > 0 ? stepRank(furthestStep, orderedSteps) : 0;
  const furthestRank = rawFurthestRank < 0 ? 0 : rawFurthestRank;

  const showStepper =
    (activeFlow.scenario === "ingest_invoice" || activeFlow.scenario === "late_grace") &&
    orderedSteps.length > 0;

  // Determine the "native" tab for the current flow step
  const flowNativeStage: LifecycleStage =
    activeFlow.step === "invoice_review" || activeFlow.step === "approval_settings" 
      ? "invoicing" 
      : "contract";

  // The active lifecycle stage is what the user has selected
  const activeLifecycleStage: LifecycleStage = lifecycleStage;

  // isFlowTab is true when we're on the native tab for the current flow step
  const isFlowTab = lifecycleStage === flowNativeStage;

  function goStep(id: FlowStepId) {
    // Clear any selections and switch back to flow tab
    setShowContractsList(false);
    setSelectedContract(null);
    setSelectedQuote(null);
    setSelectedInvoice(null);
    
    // Switch to the appropriate lifecycle stage for this step
    if (id === "invoice_review" || id === "approval_settings") {
      setLifecycleStage("invoicing");
    } else {
      setLifecycleStage("contract");
    }

    if (id === "invoice_review" && activeFlow.step !== "invoice_review") {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    if (activeFlow.scenario === "invoice_only") {
      patchFlowSession({ step: id });
      return;
    }
    if (activeFlow.scenario === "late_grace") {
      const targetRank = stepRank(id, LATE_GRACE_STEPS);
      if (targetRank < 0) return;
      if (targetRank > furthestRank) return;
      patchFlowSession({ step: id });
      return;
    }
    if (activeFlow.scenario !== "ingest_invoice") {
      patchFlowSession({ step: id });
      return;
    }
    const targetRank = stepRank(id, ingestSteps);
    if (targetRank < 0) return;
    if (targetRank > furthestRank) return;
    patchFlowSession({
      step: id,
      ingestReadOnly: id === "ingest" && persona === "approver",
    });
  }

  function handleLifecycleStageChange(stage: LifecycleStage) {
    setShowContractsList(false);
    setSelectedQuote(null);
    setSelectedInvoice(null);
    setSelectedContract(null);
    setLifecycleStage(stage);
  }

  const handleQuoteSelect = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
  }, []);

  const handleQuoteVersionChange = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
  }, []);

  const handleContractSelect = useCallback((contract: { id: string; customerId: string }) => {
    setShowContractsList(false);
    // Find the full contract from our data
    const fullContract = customerContracts.find((c) => c.id === contract.id);
    if (fullContract) {
      setSelectedContract(fullContract);
    }
  }, [customerContracts]);

  // Show the "All contracts" tab only for Early/Late Renewal, not New Deal
  const showAllContractsTab = showStepper && isFlowTab && flow.scenario !== "invoice_only";

  // Content for the "All contracts" tab when active
  const allContractsContent = (showContractsList || selectedContract) ? (
    selectedContract ? (
      <div className="mx-auto max-w-[860px] px-6 py-6">
        <ContractStageContent
          contract={selectedContract}
          onBack={() => setSelectedContract(null)}
        />
      </div>
    ) : (
      <div className="mx-auto max-w-[1020px] px-6 py-6">
        <ContractListView
          contracts={customerContracts}
          onSelect={handleContractSelect}
          pendingIngestions={pendingIngestions}
        />
      </div>
    )
  ) : undefined;

  const handleInvoiceSelect = useCallback((invoice: Invoice) => {
    setSelectedInvoice(invoice);
  }, []);

  const handleInvoiceIdSelect = useCallback((invoiceId: string) => {
    const inv = customerInvoices.find((i) => i.id === invoiceId);
    if (inv) setSelectedInvoice(inv);
  }, [customerInvoices]);

  const shellKey = `${activeFlow.key ?? "flow"}-${activeFlow.step}-${queueId ?? ""}-${invoiceId ?? ""}`;

  const ingestReadOnly = Boolean(activeFlow.ingestReadOnly);

  const lateContractId = flow.contractId ?? context?.contractId;

  const disabledStages = useMemo(() => {
    const disabled = new Set<LifecycleStage>();
    disabled.add("payment");
    disabled.add("revrec");
    return disabled;
  }, []);

  // Get quote versions for the selected quote's lineage
  const quoteVersions = useMemo(() => {
    if (!selectedQuote) return [];
    return customerQuotes
      .filter((q) => q.lineageId === selectedQuote.lineageId)
      .sort((a, b) => b.version - a.version);
  }, [selectedQuote, customerQuotes]);

  // Get the contract for the selected invoice
  const invoiceContract = useMemo(() => {
    if (!selectedInvoice?.contractId) return customerContracts[0];
    return customerContracts.find((c) => c.id === selectedInvoice.contractId) ?? customerContracts[0];
  }, [selectedInvoice, customerContracts]);

  function renderWorkspaceContent() {
    // If we're on the flow tab (contract during ingestion, invoicing during invoice_review), don't render workspace content
    // The flow step components will render instead (including "All contracts" tab content via IngestWorkspaceTabs)
    if (isFlowTab) return null;

    switch (lifecycleStage) {
      case "customer":
        return customer ? (
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100">
            <div className="mx-auto max-w-[860px] px-6 py-6">
              <CustomerStageContent customer={customer} />
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center bg-gray-100 py-12 text-text-muted">
            Customer data not available
          </div>
        );
      case "quote":
        return (
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100">
            <div className="mx-auto max-w-[860px] px-6 py-6">
              {selectedQuote ? (
                <QuoteStageContent
                  quote={selectedQuote}
                  quoteVersions={quoteVersions}
                  onQuoteVersionChange={handleQuoteVersionChange}
                  onBack={() => setSelectedQuote(null)}
                />
              ) : customerQuotes.length > 0 ? (
                <div className="max-w-[1020px]">
                  <QuoteListView quotes={customerQuotes} onSelect={handleQuoteSelect} />
                </div>
              ) : (
                <div className="rounded-lg border border-border-default bg-white px-6 py-12 text-center text-text-muted">
                  No quotes available for this customer
                </div>
              )}
            </div>
          </div>
        );
      case "contract":
        // Show contract list when on contract tab but not in flow
        return (
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100">
            <div className="mx-auto max-w-[1020px] px-6 py-6">
              <ContractListView 
                contracts={customerContracts} 
                onSelect={handleContractSelect}
                pendingIngestions={pendingIngestions}
              />
            </div>
          </div>
        );
      case "invoicing":
        return (
          <div className="min-h-0 flex-1 overflow-y-auto bg-gray-100">
            <div className="mx-auto max-w-[860px] px-6 py-6">
              {selectedInvoice && invoiceContract ? (
                <InvoicingStageContent
                  invoice={selectedInvoice}
                  contract={invoiceContract}
                  customerInvoices={customerInvoices}
                  onInvoiceSelect={handleInvoiceIdSelect}
                  onBack={() => setSelectedInvoice(null)}
                />
              ) : customerInvoices.length > 0 ? (
                <div className="max-w-[1020px]">
                  <InvoiceListView 
                    invoices={customerInvoices} 
                    onSelect={handleInvoiceSelect} 
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-border-default bg-white px-6 py-12 text-center text-text-muted">
                  No invoices available for this customer
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-gray-100">
      <UnifiedFlowShellHeader
        onClose={onClose}
        customerName={customer?.name ?? queueItem?.customerName}
        activeFlow={activeFlow}
        orderedSteps={orderedSteps}
        furthestRank={furthestRank}
        goStep={goStep}
        showStepper={showStepper}
        queueScenario={queueItem?.scenario}
      />

      {/* Hide lifecycle tabs for New Business scenario - no existing customer context */}
      {queueItem?.scenario !== "New Business" && (
        <LifecycleTabBar
          activeStage={activeLifecycleStage}
          onStageChange={handleLifecycleStageChange}
          flowStep={activeFlow.step}
          disabledStages={disabledStages}
        />
      )}

      {showCelebration && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-600/10 backdrop-blur-[2px] animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-8 py-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles size={24} className="text-white" />
            </div>
            <p className="text-[15px] font-semibold text-text-primary">Invoice Ready for Review</p>
            <p className="text-[13px] text-text-muted">Contract processed successfully</p>
          </div>
        </div>
      )}

      <div key={shellKey} className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {renderWorkspaceContent()}

        {isFlowTab && flow.scenario === "ingest_invoice" && flow.step === "ingest" && queueId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <IngestDrawer
              entityType="queue_item"
              mode="ingest"
              entityId={queueId}
              context={context}
              onClose={onClose}
              presentation="page"
              omitHeader
              readOnly={ingestReadOnly}
              allContractsContent={allContractsContent}
              showAllContracts={showAllContractsTab}
              allContractsIsActive={showContractsList || selectedContract !== null}
              onAllContractsTabClick={() => {
                setShowContractsList(true);
                setSelectedContract(null);
              }}
              onAllContractsDeactivate={() => {
                setShowContractsList(false);
                setSelectedContract(null);
              }}
              allContractsShowBack={selectedContract !== null}
              onAllContractsBack={() => setSelectedContract(null)}
            />
          </div>
        ) : null}

        {isFlowTab && flow.scenario === "ingest_invoice" && flow.step === "close_prior" && queueId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <EarlyRenewalClosePriorStep
              queueItemId={queueId}
              allContractsContent={allContractsContent}
              showAllContracts={showAllContractsTab}
              allContractsIsActive={showContractsList || selectedContract !== null}
              onAllContractsTabClick={() => {
                setShowContractsList(true);
                setSelectedContract(null);
              }}
              onAllContractsDeactivate={() => {
                setShowContractsList(false);
                setSelectedContract(null);
              }}
              allContractsShowBack={selectedContract !== null}
              onAllContractsBack={() => setSelectedContract(null)}
            />
          </div>
        ) : null}

        {isFlowTab && flow.scenario === "ingest_invoice" && flow.step === "invoice_review" && queueId && invoiceId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <InvoiceReviewStep
              queueItemId={queueId}
              invoiceId={invoiceId}
              allContractsContent={allContractsContent}
              showAllContracts={showAllContractsTab}
              allContractsIsActive={showContractsList || selectedContract !== null}
              onAllContractsTabClick={() => {
                setShowContractsList(true);
                setSelectedContract(null);
              }}
              onAllContractsDeactivate={() => {
                setShowContractsList(false);
                setSelectedContract(null);
              }}
              allContractsShowBack={selectedContract !== null}
              onAllContractsBack={() => setSelectedContract(null)}
            />
          </div>
        ) : null}

        {flow.scenario === "invoice_only" && flow.step === "approval" && invoiceId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <InvoiceApprovalDrawer
              invoiceId={invoiceId}
              queueItemId={queueId}
              onClose={onClose}
              omitHeader={false}
            />
          </div>
        ) : null}

        {flow.scenario === "late_grace" &&
        flow.step === "grace_extend" &&
        lateContractId ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ExtendGraceStep
              queueItemId={queueId ?? ""}
              contractId={lateContractId}
              allContractsContent={allContractsContent}
              showAllContracts={showAllContractsTab}
              allContractsIsActive={showContractsList || selectedContract !== null}
              onAllContractsTabClick={() => {
                setShowContractsList(true);
                setSelectedContract(null);
              }}
              onAllContractsDeactivate={() => {
                setShowContractsList(false);
                setSelectedContract(null);
              }}
              allContractsShowBack={selectedContract !== null}
              onAllContractsBack={() => setSelectedContract(null)}
            />
          </div>
        ) : null}

        {isFlowTab && !showContractsList && !selectedContract && flow.step === "approval_settings" ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <ApprovalSettingsStep 
              queueItemId={queueId} 
              invoiceId={invoiceId}
              onComplete={() => {
                // Stay in workbench - just show completion state
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function UnifiedFlowShell({ onClose }: { onClose: () => void }) {
  return (
    <UnifiedDrawerChromeProvider>
      <UnifiedFlowShellInner onClose={onClose} />
    </UnifiedDrawerChromeProvider>
  );
}
