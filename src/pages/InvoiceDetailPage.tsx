import { useParams, useSearchParams } from "react-router-dom";
import { getCustomerForInvoice, getQuotesForCustomer, getContractsForCustomer, getQuote, getContract, getTasks } from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";

  const customer = getCustomerForInvoice(invoiceId ?? "");
  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContracts = getContractsForCustomer(customer.id);
  const quote = customerQuotes[0] ?? getQuote();
  const contract = customerContracts[0] ?? getContract();
  const tasks = getTasks(customer.id);

  return (
    <CustomerRevenueWorkspace
      customer={customer}
      quote={quote}
      contract={contract}
      tasks={tasks}
      initialStage="invoicing"
      from={from}
      activeRecordId={invoiceId}
    />
  );
}
