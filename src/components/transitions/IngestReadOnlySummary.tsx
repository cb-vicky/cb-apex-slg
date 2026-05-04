import { useMemo } from "react";
import { useIngestContext } from "@/context/IngestContext";
import { getExtractedContract } from "@/data/ingest-data";
import { currency, shortDate } from "@/lib/utils";
import { KV, SectionCard } from "@/components/ui/primitives";

/**
 * Read-only recap of queue ingest mapping (approver “back” step in unified flow).
 */
export function IngestReadOnlySummary({ queueItemId }: { queueItemId: string }) {
  const { queueItems } = useIngestContext();
  const queueItem = useMemo(
    () => queueItems.find((q) => q.id === queueItemId),
    [queueItems, queueItemId],
  );
  const extracted = useMemo(
    () => (queueItem?.sampleId ? getExtractedContract(queueItem.sampleId) : null),
    [queueItem],
  );

  if (!queueItem) {
    return (
      <p className="text-[13px] text-text-muted">Queue item not found for this ingest.</p>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-4 text-[13px] leading-snug">
      <div className="rounded-lg border border-border-subtle bg-surface-muted/40 px-3 py-2 text-[12px] text-text-secondary">
        Read-only view — same structure the operator used during mapping.
      </div>

      <SectionCard title="Queue document">
        <div className="flex flex-col divide-y divide-border-subtle">
          <KV label="Queue ID" value={queueItem.id} />
          <KV label="Document" value={queueItem.documentName} />
          <KV label="Scenario" value={queueItem.scenario} />
          <KV label="Source" value={`${queueItem.source}${queueItem.sourceDetail ? ` · ${queueItem.sourceDetail}` : ""}`} />
          <KV label="Uploaded" value={shortDate(queueItem.uploadedAt)} />
          <KV label="TCV" value={currency(queueItem.tcv)} />
        </div>
      </SectionCard>

      {extracted ? (
        <SectionCard title="Extracted commercial terms">
          <div className="flex flex-col divide-y divide-border-subtle">
            <KV label="Customer (extracted)" value={extracted.customerName} />
            <KV label="Legal entity" value={extracted.customerLegalEntity} />
            <KV label="Term" value={extracted.terms.term} />
            <KV label="Start" value={extracted.terms.startDate} />
            <KV label="End" value={extracted.terms.endDate} />
            <KV label="TCV (extracted)" value={currency(extracted.terms.tcv)} />
            <KV label="Billing frequency" value={extracted.terms.billingFrequency} />
            <KV label="Payment terms" value={extracted.terms.paymentTerms} />
          </div>
        </SectionCard>
      ) : null}

      {queueItem.contractId ? (
        <SectionCard title="Linked records (session)">
          <div className="flex flex-col divide-y divide-border-subtle">
            {queueItem.customerId ? <KV label="Customer ID" value={queueItem.customerId} /> : null}
            <KV label="Contract ID" value={queueItem.contractId} />
            {queueItem.invoiceId ? <KV label="First invoice" value={queueItem.invoiceId} /> : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
