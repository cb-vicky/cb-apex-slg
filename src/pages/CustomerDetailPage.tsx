import { useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  getCustomer,
  getQuotesForCustomer,
  getContractsForCustomer,
  getQuote,
  getContract,
  getTasks,
} from "@/data/mock-data";
import { CustomerRevenueWorkspace } from "@/components/revenue-workspace/CustomerRevenueWorkspace";
import type { Stage } from "@/components/revenue-workspace/RevenueJourneyRail";
import { recordCustomerVisit } from "@/lib/recent-customers";
import { useIngestContext } from "@/context/IngestContext";

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const { sessionCustomers, sessionContracts } = useIngestContext();

  useEffect(() => {
    if (customerId) recordCustomerVisit(customerId);
  }, [customerId]);

  const tab = (searchParams.get("tab") ?? "customer") as Stage;
  const quoteId = searchParams.get("quoteId");
  const contractId = searchParams.get("contractId");
  const invoiceId = searchParams.get("invoiceId");
  const from = searchParams.get("from") ?? "";
  const closeIntent = searchParams.get("closeIntent") ?? undefined;
  const queueItemId = searchParams.get("queueItemId") ?? undefined;

  const customer = useMemo(() => {
    return sessionCustomers.find((c) => c.id === customerId) ?? getCustomer(customerId ?? "");
  }, [customerId, sessionCustomers]);

  const customerQuotes = getQuotesForCustomer(customer.id);
  const customerContractsMerged = useMemo(() => {
    const seed = getContractsForCustomer(customer.id);
    const extra = sessionContracts.filter((c) => c.customerId === customer.id);
    return [
      ...seed,
      ...extra.filter((e) => !seed.some((s) => s.id === e.id)),
    ];
  }, [customer.id, sessionContracts]);

  const tasks = getTasks(customer.id);

  // Resolve quote — null when customer has no quotes (e.g. Zenith Analytics)
  const quote = quoteId ? getQuote(quoteId) : customerQuotes[0] ?? null;

  // Resolve contract — merge session so ingested Scheduled / Active rows resolve
  const contractRecord = contractId
    ? sessionContracts.find((c) => c.id === contractId) ?? getContract(contractId)
    : customerContractsMerged[0] ?? null;

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
      closeIntent={closeIntent}
      queueItemId={queueItemId}
    />
  );
}
