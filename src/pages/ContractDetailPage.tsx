import { useParams, useSearchParams } from "react-router-dom";
import { getCustomerForContract, getContract, getQuotesForCustomer, getQuote, getTasks } from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";

export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";

  const contract = getContract(contractId ?? "");
  const customer = getCustomerForContract(contract.id);
  const customerQuotes = getQuotesForCustomer(customer.id);
  const quote = contract.sourceQuoteId
    ? getQuote(contract.sourceQuoteId)
    : customerQuotes[0] ?? getQuote();
  const tasks = getTasks(customer.id);

  return (
    <CustomerRevenueWorkspace
      customer={customer}
      quote={quote}
      contract={contract}
      tasks={tasks}
      initialStage="contract"
      from={from}
      activeRecordId={contractId}
    />
  );
}
