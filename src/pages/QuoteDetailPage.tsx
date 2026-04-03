import { useParams, useSearchParams } from "react-router-dom";
import { getCustomerForQuote, getQuote, getContractsForCustomer, getContract, getTasks } from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";

export function QuoteDetailPage() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";

  const quote = getQuote(quoteId ?? "");
  const customer = getCustomerForQuote(quote.id);
  const customerContracts = getContractsForCustomer(customer.id);
  const contract = quote.relatedContractId
    ? getContract(quote.relatedContractId)
    : customerContracts[0] ?? getContract();
  const tasks = getTasks(customer.id);

  return (
    <CustomerRevenueWorkspace
      customer={customer}
      quote={quote}
      contract={contract}
      tasks={tasks}
      initialStage="quote"
      from={from}
      activeRecordId={quoteId}
    />
  );
}
