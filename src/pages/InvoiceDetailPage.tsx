import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getCustomer,
  getCustomerForInvoice,
  getQuotesForCustomer,
  getContractsForCustomer,
  getQuote,
  getContract,
  getTasks,
  getInvoice,
} from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";
import { useIngestContext } from "@/context/IngestContext";

export function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from") ?? "";
  const { sessionInvoices, sessionCustomers, sessionContracts } = useIngestContext();

  const invoice = useMemo(() => {
    return sessionInvoices.find((i) => i.id === invoiceId) ?? getInvoice(invoiceId ?? "");
  }, [invoiceId, sessionInvoices]);

  const customer = useMemo(() => {
    if (!invoice) return getCustomerForInvoice(invoiceId ?? "");
    return sessionCustomers.find((c) => c.id === invoice.customerId) ?? getCustomer(invoice.customerId);
  }, [invoice, invoiceId, sessionCustomers]);

  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContractsSeed = getContractsForCustomer(customer.id);
  const customerContracts = useMemo(() => {
    const extra = sessionContracts.filter((c) => c.customerId === customer.id);
    return [
      ...customerContractsSeed,
      ...extra.filter((e) => !customerContractsSeed.some((s) => s.id === e.id)),
    ];
  }, [customer.id, customerContractsSeed, sessionContracts]);

  const quote = customerQuotes[0] ?? getQuote();
  const contract = useMemo(() => {
    if (!invoice) return customerContracts[0] ?? getContract();
    return (
      sessionContracts.find((c) => c.id === invoice.contractId) ??
      customerContracts.find((c) => c.id === invoice.contractId) ??
      getContract(invoice.contractId)
    );
  }, [invoice, customerContracts, sessionContracts]);

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
