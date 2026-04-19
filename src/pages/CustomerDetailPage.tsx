import { useParams, useSearchParams } from "react-router-dom";
import { getCustomer, getQuotesForCustomer, getContractsForCustomer, getQuote, getContract, getTasks } from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";
import type { Stage } from "@/components/revenue-workspace/RevenueJourneyRail";

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();

  const tab = (searchParams.get("tab") ?? "customer") as Stage;
  const quoteId = searchParams.get("quoteId");
  const contractId = searchParams.get("contractId");
  const invoiceId = searchParams.get("invoiceId");
  const from = searchParams.get("from") ?? "";

  const customer = getCustomer(customerId ?? "");
  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContracts = getContractsForCustomer(customer.id);
  const tasks = getTasks(customer.id);

  // Resolve quote — null when customer has no quotes (e.g. Zenith Analytics)
  const quote = quoteId
    ? getQuote(quoteId)
    : customerQuotes[0] ?? null;

  // Resolve contract — null when customer has no contracts yet (e.g. Pioneer Systems)
  const contractRecord = contractId
    ? getContract(contractId)
    : customerContracts[0] ?? null;

  const activeRecordId = quoteId ?? contractId ?? invoiceId ?? undefined;

  return (
    <CustomerRevenueWorkspace
      customer={customer}
      quote={quote}
      contract={contractRecord}
      tasks={tasks}
      initialStage={tab}
      from={from}
      activeRecordId={activeRecordId}
    />
  );
}
