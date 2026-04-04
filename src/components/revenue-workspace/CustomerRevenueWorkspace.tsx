import { useState } from "react";
import type { Customer, Quote, Contract, Invoice, Task } from "@/data/mock-data";
import { getInvoices } from "@/data/mock-data";
import { getInvoiceEnrichment, getCollectionCasesForCustomer, getCustomerArSummary } from "@/data/billing-data";
import { getRevenueArrangement } from "@/data/revrec-data";
import { deriveAllStageStatuses } from "./derive-stage-data";
import { CustomerWorkspaceHeader } from "./CustomerWorkspaceHeader";
import { RevenueJourneyRail, type Stage } from "./RevenueJourneyRail";
import { RecordContextBar } from "./RecordContextBar";
import { QuoteStageContent } from "./quote/QuoteStageContent";
import { ContractStageContent } from "./contract/ContractStageContent";
import { CustomerStageContent } from "./customer/CustomerStageContent";
import { InvoicingStageContent } from "./invoicing/InvoicingStageContent";
import { PaymentStageContent } from "./payment/PaymentStageContent";
import { RevRecStageContent } from "./revrec/RevRecStageContent";
import { InsightRail } from "./InsightRail";
import { DetailBreadcrumb } from "./DetailBreadcrumb";

interface Props {
  customer: Customer;
  quote: Quote;
  contract: Contract;
  tasks: Task[];
  initialStage: Stage;
  from?: string;
  activeRecordId?: string;
}

export function CustomerRevenueWorkspace({ customer, quote, contract, tasks, initialStage, from, activeRecordId }: Props) {
  const [activeStage, setActiveStage] = useState<Stage>(initialStage);

  const stageStatuses = deriveAllStageStatuses(customer, quote, contract);

  const customerInvoices = getInvoices(customer.id);
  const selectedInvoice: Invoice | undefined = activeRecordId
    ? customerInvoices.find((i) => i.id === activeRecordId) ?? customerInvoices[0]
    : customerInvoices[0];

  const invoiceEnrichment = selectedInvoice ? getInvoiceEnrichment(selectedInvoice.id) : undefined;
  const collectionCases = getCollectionCasesForCustomer(customer.id);
  const primaryCase = collectionCases[0];
  const arSummary = getCustomerArSummary(customer.id);
  const revenueArrangement = getRevenueArrangement(contract.id);

  const currentRecordId = activeStage === "quote" ? quote.id
    : activeStage === "contract" ? contract.id
    : activeStage === "invoicing" && selectedInvoice ? selectedInvoice.id
    : activeStage === "revrec" && revenueArrangement ? revenueArrangement.id
    : activeRecordId;

  function renderStageContent() {
    switch (activeStage) {
      case "customer":
        return <CustomerStageContent customer={customer} />;
      case "quote":
        return <QuoteStageContent quote={quote} />;
      case "contract":
        return <ContractStageContent contract={contract} />;
      case "invoicing":
        return selectedInvoice ? <InvoicingStageContent invoice={selectedInvoice} contract={contract} /> : null;
      case "payment":
        return <PaymentStageContent customer={customer} />;
      case "revrec":
        return <RevRecStageContent contract={contract} />;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto">
      <div className="flex flex-col gap-4 rounded-tl-[24px] border border-[rgba(225,226,230,1)] px-6 py-5 shadow-[-1px_4px_24px_0px_rgba(0,0,0,0.15)]">
        {from && (
          <DetailBreadcrumb
            from={from}
            customerName={customer.name}
            activeStage={activeStage}
            recordId={currentRecordId}
          />
        )}
        <CustomerWorkspaceHeader customer={customer} />
        <RevenueJourneyRail
          activeStage={activeStage}
          onStageChange={setActiveStage}
          stageStatuses={stageStatuses}
        />
        {activeStage !== "customer" && (
          <RecordContextBar
            activeStage={activeStage}
            quote={quote}
            contract={contract}
            invoice={selectedInvoice}
            invoiceEnrichment={invoiceEnrichment}
            primaryCollectionCase={primaryCase}
            totalOpenAr={arSummary.totalOpen}
            revenueArrangement={revenueArrangement}
          />
        )}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>{renderStageContent()}</div>
          <InsightRail
            activeStage={activeStage}
            tasks={tasks}
            customer={customer}
            quote={quote}
            contract={contract}
            invoice={selectedInvoice}
            revenueArrangement={revenueArrangement}
          />
        </div>
      </div>
    </div>
  );
}
