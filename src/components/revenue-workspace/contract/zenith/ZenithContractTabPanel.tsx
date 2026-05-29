import type { ZenithContractActiveTab } from "./zenith-contract-tabs";
import { ZenithContractAddressesTab } from "./ZenithContractAddressesTab";
import { ZenithContractBillingInfoTab } from "./ZenithContractBillingInfoTab";
import { ZenithContractItemsTab } from "./ZenithContractItemsTab";
import { ZenithContractSummaryTab } from "./ZenithContractSummaryTab";
import { ZenithMarkTabDoneBar } from "./ZenithMarkTabDoneBar";

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

  if (activeTab === "Additional info") {
    return (
      <div className="flex flex-col gap-4">
        <ZenithMarkTabDoneBar tab="Additional info" />
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-border-default bg-white px-5 py-12 text-center">
          <p className="text-[13px] text-text-muted">Additional info — content coming soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-border-default bg-white px-5 py-12 text-center">
      <p className="text-[13px] text-text-muted">Document preview coming soon.</p>
    </div>
  );
}
