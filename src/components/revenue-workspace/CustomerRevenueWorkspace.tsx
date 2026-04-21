import { useEffect, useState } from "react";
import type { Customer, Quote, Contract, Invoice, Task } from "@/data/mock-data";
import { getInvoices, getQuoteLineage, getQuotesForCustomer, getContractsForCustomer } from "@/data/mock-data";
import { getCollectionCasesForCustomer } from "@/data/billing-data";
import { getRevenueArrangement } from "@/data/revrec-data";
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
}

export function CustomerRevenueWorkspace({
  customer,
  quote,
  contract,
  tasks,
  initialStage,
  from,
  activeRecordId,
}: Props) {
  const [activeStage, setActiveStage] = useState<Stage>(initialStage);

  // "list" = record picker; "detail" = full stage content
  const [viewMode, setViewMode] = useState<"list" | "detail">(
    activeRecordId ? "detail" : "list",
  );

  const [activeQuote, setActiveQuote] = useState<Quote | null>(quote);
  const [activeContract, setActiveContract] = useState<Contract | null>(contract);

  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContracts = getContractsForCustomer(customer.id);
  const customerInvoices = getInvoices(customer.id);

  const quoteVersions = activeQuote ? getQuoteLineage(activeQuote.lineageId) : [];

  // Initial invoice: pre-select when deep-linked to a specific invoice
  const initialInvoice: Invoice | undefined =
    activeRecordId && initialStage === "invoicing"
      ? customerInvoices.find((i) => i.id === activeRecordId)
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
    ...(customerInvoices.length === 0 ? (["payment"] as Stage[]) : []),
  ]);

  const effectiveContract = activeContract ?? contract;

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
              contracts={customerContracts}
              onSelect={(c) => {
                setActiveContract(c);
                setViewMode("detail");
              }}
            />
          );
        case "invoicing":
          return (
            <InvoiceListView
              invoices={customerInvoices}
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
      case "contract":
        return effectiveContract ? (
          <ContractStageContent contract={effectiveContract} onBack={handleBackToList} />
        ) : (
          <EmptyState message="No contract found for this customer." />
        );
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

      {/* Main content — scrolls under the sticky bar (bg inherited from AppShell's white card) */}
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
