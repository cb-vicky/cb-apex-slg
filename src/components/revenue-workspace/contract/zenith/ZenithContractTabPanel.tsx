import type { IngestQueueSampleId } from "@/data/ingest-data";
import type { ZenithContractActiveTab, ZenithContractDocumentTabId } from "./zenith-contract-tabs";
import { ZenithContractAddressesTab } from "./ZenithContractAddressesTab";
import { ZenithContractBillingInfoTab } from "./ZenithContractBillingInfoTab";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import { ZenithContractDocumentPreview } from "./ZenithContractDocumentPreview";
import { ZenithContractItemsTab } from "./ZenithContractItemsTab";
import { ZenithContractSummaryTab } from "./ZenithContractSummaryTab";
import { ZenithContractInvoicePreviewTab } from "./ZenithContractInvoicePreviewTab";

interface Props {
  activeTab: ZenithContractActiveTab;
  ingestionSampleId?: IngestQueueSampleId;
}

export function ZenithContractTabPanel({ activeTab, ingestionSampleId }: Props) {
  const chrome = useZenithContractChrome();

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

  // Document preview tab - pass the document change handler
  const handleDocumentChange = (docId: ZenithContractDocumentTabId) => {
    chrome?.setActiveTab(docId);
  };

  return (
    <ZenithContractDocumentPreview 
      documentTabId={activeTab} 
      onDocumentChange={handleDocumentChange}
    />
  );
}
