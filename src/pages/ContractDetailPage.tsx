import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getCustomerForContract,
  getContract,
  getQuotesForCustomer,
  getQuote,
  getTasks,
} from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";
import { useIngestContext } from "@/context/IngestContext";

export function ContractDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const { sessionContracts, sessionCustomers } = useIngestContext();

  const contract = useMemo(
    () => sessionContracts.find((c) => c.id === contractId) ?? getContract(contractId ?? ""),
    [contractId, sessionContracts],
  );

  const customer = useMemo(
    () =>
      sessionCustomers.find((c) => c.id === contract.customerId) ??
      getCustomerForContract(contract.id),
    [contract.customerId, contract.id, sessionCustomers],
  );

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
