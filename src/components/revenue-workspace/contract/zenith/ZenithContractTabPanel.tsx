import type { IngestQueueSampleId } from "@/data/ingest-data";
import type { ZenithContractActiveTab } from "./zenith-contract-tabs";
import { ZenithContractAddressesTab } from "./ZenithContractAddressesTab";
import { ZenithContractBillingInfoTab } from "./ZenithContractBillingInfoTab";
import { ZenithContractDocumentPreview } from "./ZenithContractDocumentPreview";
import { ZenithContractItemsTab } from "./ZenithContractItemsTab";
import { ZenithContractSummaryTab } from "./ZenithContractSummaryTab";
import { ZenithContractInvoicePreviewTab } from "./ZenithContractInvoicePreviewTab";

interface Props {
  activeTab: ZenithContractActiveTab;
  ingestionSampleId?: IngestQueueSampleId;
}

export function ZenithContractTabPanel({ activeTab, ingestionSampleId }: Props) {
  if (activeTab === "Summary") {
    return <ZenithContractSummaryTab />;
  }

  if (activeTab === "Items") {
    return <ZenithContractItemsTab ingestionSampleId={ingestionSampleId} />;
  }

  if (activeTab === "Billing info") {
    return <ZenithContractBillingInfoTab />;
  }

  if (activeTab === "Addresses") {
    return <ZenithContractAddressesTab />;
  }

  if (activeTab === "Invoice Preview") {
    return <ZenithContractInvoicePreviewTab />;
  }

  // Document preview tab - document switching is handled by CustomerContextBar
  return <ZenithContractDocumentPreview documentTabId={activeTab} />;
}
