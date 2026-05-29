import type { ZenithContractActiveTab } from "./zenith-contract-tabs";
import { ZenithContractAddressesTab } from "./ZenithContractAddressesTab";
import { ZenithContractBillingInfoTab } from "./ZenithContractBillingInfoTab";
import { ZenithContractDocumentPreview } from "./ZenithContractDocumentPreview";
import { ZenithContractItemsTab } from "./ZenithContractItemsTab";
import { ZenithContractSummaryTab } from "./ZenithContractSummaryTab";

interface Props {
  activeTab: ZenithContractActiveTab;
}

export function ZenithContractTabPanel({ activeTab }: Props) {
  if (activeTab === "Summary") {
    return <ZenithContractSummaryTab />;
  }

  if (activeTab === "Items") {
    return <ZenithContractItemsTab />;
  }

  if (activeTab === "Billing info") {
    return <ZenithContractBillingInfoTab />;
  }

  if (activeTab === "Addresses") {
    return <ZenithContractAddressesTab />;
  }

  return <ZenithContractDocumentPreview documentTabId={activeTab} />;
}
