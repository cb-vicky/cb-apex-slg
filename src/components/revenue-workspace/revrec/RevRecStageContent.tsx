import type { Contract } from "@/data/mock-data";
import { getRevenueArrangement, type RevenueArrangement } from "@/data/revrec-data";
import { ArrangementOverviewSection } from "./ArrangementOverviewSection";
import { ObligationsSection } from "./ObligationsSection";
import { RecognitionScheduleSection } from "./RecognitionScheduleSection";
import { CloseReadinessSection } from "./CloseReadinessSection";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";

interface Props {
  contract: Contract;
}

function NoArrangement({ contractId }: { contractId: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border-default text-[13px] text-text-muted">
      No revenue arrangement found for contract {contractId}. Arrangement will be created when the contract is enforced.
    </div>
  );
}

export function RevRecStageContent({ contract }: Props) {
  const arrangement: RevenueArrangement | undefined = getRevenueArrangement(contract.id);

  if (!arrangement) {
    return <NoArrangement contractId={contract.id} />;
  }

  return (
    <div className="flex flex-col gap-3">
      <WorkspaceSectionAnchor id="ws-section-revrec-overview">
        <ArrangementOverviewSection arrangement={arrangement} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-revrec-obligations">
        <ObligationsSection obligations={arrangement.obligations} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-revrec-schedule">
        <RecognitionScheduleSection
          schedule={arrangement.schedule}
          amendmentImpacts={arrangement.amendmentImpacts}
          invoiceImpacts={arrangement.invoiceImpacts}
        />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-revrec-close">
        <CloseReadinessSection
          blockers={arrangement.closeBlockers}
          journalExports={arrangement.journalExports}
          adjustments={arrangement.adjustments}
          arrangement={arrangement}
        />
      </WorkspaceSectionAnchor>
    </div>
  );
}
