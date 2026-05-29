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
import type { Stage } from "@/components/revenue-workspace/stage";
import { recordCustomerVisit } from "@/lib/recent-customers";
import { useIngestContext } from "@/context/IngestContext";
import {
  ZENITH_ACTIVE_CONTRACT_ID,
  ZENITH_ANALYTICS_INC_ID,
} from "@/data/zenith-analytics-inc-seed";

export function CustomerDetailPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const [searchParams] = useSearchParams();
  const { sessionCustomers, sessionContracts, queueItems } = useIngestContext();

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
  const queueItem = queueItemId ? queueItems.find((q) => q.id === queueItemId) : undefined;

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
  const queueResolvedContractId =
    tab === "contract" && queueItemId
      ? queueItem?.contractId ??
        queueItem?.activeContractId ??
        (customer.id === ZENITH_ANALYTICS_INC_ID
          ? ZENITH_ACTIVE_CONTRACT_ID
          : customerContractsMerged[0]?.id)
      : undefined;

  const tasks = getTasks(customer.id);

  // Resolve quote — null when customer has no quotes (e.g. Zenith Analytics)
  const quote = quoteId ? getQuote(quoteId) : customerQuotes[0] ?? null;

  // Resolve contract — merge session so ingested Scheduled / Active rows resolve
  const resolvedContractId = contractId ?? queueResolvedContractId;
  const contractRecord = resolvedContractId
    ? sessionContracts.find((c) => c.id === resolvedContractId) ?? getContract(resolvedContractId)
    : customerContractsMerged[0] ?? null;

  const activeRecordId = quoteId ?? resolvedContractId ?? invoiceId ?? undefined;
  const workspaceKey = `${customer.id}:${tab}:${activeRecordId ?? "none"}:${queueItemId ?? "none"}:${closeIntent ?? "none"}`;

  return (
    <CustomerRevenueWorkspace
      key={workspaceKey}
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
