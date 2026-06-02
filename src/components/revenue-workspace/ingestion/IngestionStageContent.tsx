import { useSearchParams } from "react-router-dom";
import type { Customer } from "@/data/mock-data";
import type { IngestionSession } from "@/context/ingest-context-core";
import { IngestionActions } from "./IngestionActions";
import {
  ingestionSubToZenithTab,
  isZenithBackedIngestionSub,
  type IngestionSubTab,
} from "./ingestion-zenith-sync";
import { useZenithContractChrome } from "../contract/zenith/ZenithContractChromeContext";
import { ZenithContractTabPanel } from "../contract/zenith/ZenithContractTabPanel";
import { ZenithContractCommentsPanel } from "../contract/zenith/ZenithContractCommentsPanel";

interface Props {
  session: IngestionSession;
  customer: Customer;
}

export function IngestionStageContent({ session, customer }: Props) {
  const [searchParams] = useSearchParams();
  const chrome = useZenithContractChrome();

  const rawSub = (searchParams.get("sub") ?? "summary") as IngestionSubTab;
  const activeZenithTab = chrome?.activeTab ?? ingestionSubToZenithTab(rawSub);

  if (!isZenithBackedIngestionSub(rawSub)) {
    return null;
  }

  return (
    <div className="relative flex flex-col gap-3">
      <IngestionActions session={session} customerId={customer.id} />
      <ZenithContractTabPanel activeTab={activeZenithTab} ingestionSampleId={session.sampleId} />
      <ZenithContractCommentsPanel />
    </div>
  );
}
