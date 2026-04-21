import { LayoutList } from "lucide-react";
import type { Contract } from "@/data/mock-data";
import { RecordHeader } from "../RecordHeader";
import { ActionButton } from "../primitives/ActionButton";
import { ContractOverviewSection } from "./ContractOverviewSection";
import { ContractTermsSection } from "./ContractTermsSection";
import { ContractEnforcementSection } from "./ContractEnforcementSection";
import { ContractBillingSection } from "./ContractBillingSection";
import { ContractAmendmentsSection } from "./ContractAmendmentsSection";
import { ContractFinanceSection } from "./ContractFinanceSection";
import { ContractDocumentsSection } from "./ContractDocumentsSection";
import { ContractDifferencesSection } from "./ContractDifferencesSection";
import { ContractTimelineSection } from "./ContractTimelineSection";

interface Props {
  contract: Contract;
  onBack?: () => void;
}

export function ContractStageContent({ contract, onBack }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <RecordHeader
        stickyBar
        id={contract.id}
        status={contract.status}
        tagline={contract.enforcement.enforcementStatus}
        leadingAction={
          onBack ? <ActionButton icon={LayoutList} label="All contracts" onClick={onBack} /> : undefined
        }
        actions={
          <>
            <ActionButton label="Create Amendment" />
            <ActionButton label="Contract PDF" />
          </>
        }
      />
      <ContractOverviewSection contract={contract} />
      <ContractTermsSection products={contract.products} />
      <ContractEnforcementSection enforcement={contract.enforcement} />
      <ContractBillingSection schedule={contract.billingSchedule} />
      <ContractAmendmentsSection amendments={contract.amendments} renewalDate={contract.renewalDate} coTermBehavior={contract.coTermBehavior} />
      <ContractFinanceSection contract={contract} />
      <ContractDifferencesSection differences={contract.comparisonToQuote} />
      <ContractDocumentsSection contract={contract} />
      <ContractTimelineSection timeline={contract.timeline} />
    </div>
  );
}
