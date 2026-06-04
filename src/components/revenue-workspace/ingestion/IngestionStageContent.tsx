import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { Customer } from "@/data/mock-data";
import type { IngestionSession } from "@/context/ingest-context-core";
import { getExtractedContract } from "@/data/ingest-data";
import { IngestionActions } from "./IngestionActions";
import {
  ingestionSubToZenithTab,
  isZenithBackedIngestionSub,
  type IngestionSubTab,
} from "./ingestion-zenith-sync";
import { useZenithContractChrome } from "../contract/zenith/ZenithContractChromeContext";
import { ZenithContractTabPanel } from "../contract/zenith/ZenithContractTabPanel";
import { ZenithContractCommentsPanel } from "../contract/zenith/ZenithContractCommentsPanel";
import { NotesSection } from "@/components/notes";

interface Props {
  session: IngestionSession;
  customer: Customer;
}

function zenithTabToNotesSubTab(tab: string): string {
  const mapping: Record<string, string> = {
    Summary: "summary",
    Items: "items",
    "Billing info": "billing",
    Addresses: "addresses",
    "Invoice Preview": "invoice_preview",
  };
  return mapping[tab] ?? "summary";
}

export function IngestionStageContent({ session, customer }: Props) {
  const [searchParams] = useSearchParams();
  const chrome = useZenithContractChrome();
  const extracted = useMemo(() => getExtractedContract(session.sampleId), [session.sampleId]);

  const rawSub = (searchParams.get("sub") ?? "summary") as IngestionSubTab;
  const activeZenithTab = chrome?.activeTab ?? ingestionSubToZenithTab(rawSub, extracted.documents);
  const notesSubTab = zenithTabToNotesSubTab(activeZenithTab);

  if (!isZenithBackedIngestionSub(rawSub)) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-3 pt-8">
      <NotesSection
        customerId={customer.id}
        customerName={customer.name}
        tab="ingestion"
        subTab={notesSubTab}
        className="mb-1"
      />
      <IngestionActions session={session} customerId={customer.id} />
      <ZenithContractTabPanel activeTab={activeZenithTab} ingestionSampleId={session.sampleId} />
      <ZenithContractCommentsPanel />
    </div>
  );
}
