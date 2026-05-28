import { useNavigate, useSearchParams } from "react-router-dom";
import { RotateCcw, Trash2 } from "lucide-react";
import { useIngestContext } from "@/context/IngestContext";
import { getExtractedContract } from "@/data/ingest-data";
import {
  buildSessionContractFromIngestion,
  buildSessionInvoiceFromIngestion,
} from "@/data/ingestion-session";
import type { IngestionSession } from "@/context/ingest-context-core";
import { RecordHeader, type OverflowItem } from "../RecordHeader";
import { ActionButton } from "../primitives/ActionButton";

interface Props {
  session: IngestionSession;
  customerId: string;
}

/**
 * Ingestion-stage actions — portals into the right `ActionsPillWrapper` slot via `RecordHeader`,
 * mirroring the flat-CTA pattern used by Quote / Contract / Invoice stage content.
 *
 * Frame 1 (review):  primary CTA = `Preview` (enabled when overall is `ready` or every section is `done`).
 * Frame 2 (preview): primary CTA = `Send for approval`; overflow contains Restart / Discard.
 */
export function IngestionActions({ session, customerId }: Props) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    discardIngestion,
    restartIngestion,
    completeIngestion,
    applyQueueItemOverride,
    addSessionContract,
    addSessionInvoice,
    submitInvoiceForApproval,
    setIngestionOverallStatus,
    setInvoiceStatusOverride,
  } = useIngestContext();

  const frame = searchParams.get("frame") || "1";
  const isFrame2 = frame === "2";

  const extracted = getExtractedContract(session.sampleId);

  const allDone = Object.values(session.sections).every((s) => s === "done");
  const previewEnabled = session.overallStatus === "ready" || allDone;

  function handlePreview() {
    const params = new URLSearchParams(searchParams);
    params.set("frame", "2");
    params.set("sub", "contract-preview");
    setSearchParams(params);
  }

  function handleRestart() {
    restartIngestion(session.queueItemId);
    const params = new URLSearchParams(searchParams);
    params.set("frame", "1");
    params.set("sub", "summary");
    setSearchParams(params);
  }

  function handleDiscard() {
    discardIngestion(session.queueItemId);
    applyQueueItemOverride(session.queueItemId, { status: "Rejected" });
    navigate(`/customers/${customerId}`);
  }

  function handleSendForApproval() {
    const contract = buildSessionContractFromIngestion(extracted, customerId);
    const invoice = buildSessionInvoiceFromIngestion(extracted, customerId, contract.id);

    addSessionContract(contract);
    addSessionInvoice(invoice);

    submitInvoiceForApproval(invoice.id, {
      customerId,
      customerName: extracted.customerName,
      invoiceAmount: invoice.amount,
      invoiceDate: invoice.date,
      ingestId: session.queueItemId,
    });

    // Reflect "Pending Approval" on the invoice itself so the details page —
    // and every list/badge derived from `mergeInvoiceStatuses` — shows the right state.
    setInvoiceStatusOverride(invoice.id, "Pending Approval");

    applyQueueItemOverride(session.queueItemId, {
      status: "Ingested",
      contractId: contract.id,
      invoiceId: invoice.id,
      customerId,
    });

    setIngestionOverallStatus(session.queueItemId, "awaiting_approval");
    completeIngestion(session.queueItemId);

    navigate(`/customers/${customerId}?tab=invoicing&invoiceId=${invoice.id}`);
  }

  if (isFrame2) {
    const overflowItems: OverflowItem[] = [
      { label: "Restart ingestion", onClick: handleRestart, icon: RotateCcw },
      { label: "Discard contract", onClick: handleDiscard, icon: Trash2, destructive: true },
    ];

    return (
      <RecordHeader
        actions={
          <ActionButton label="Send for approval" onClick={handleSendForApproval} showArrow={false} />
        }
        overflowItems={overflowItems}
      />
    );
  }

  return (
    <RecordHeader
      actions={
        <ActionButton
          label="Preview"
          onClick={handlePreview}
          showArrow={false}
          disabled={!previewEnabled}
        />
      }
    />
  );
}
