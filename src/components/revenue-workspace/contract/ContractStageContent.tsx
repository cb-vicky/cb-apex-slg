import { useMemo, useCallback, type ReactNode } from "react";
import { XCircle } from "lucide-react";
import type { Contract } from "@/data/mock-data";
import type { ContractGraceExtension } from "@/data/contract-transition";
import { useIngestContext } from "@/context/IngestContext";
import { mergeBillingScheduleWithInvoiceOverrides } from "@/components/revenue-workspace/derive-stage-data";
import { RecordHeader, type OverflowItem } from "../RecordHeader";
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
import { ClosureSummaryCard } from "@/components/contracts/ClosureSummaryCard";
import { ClosureBanner } from "@/components/contracts/ClosureBanner";
import { ScheduledBanner } from "@/components/contracts/ScheduledBanner";
import { WorkspaceSectionAnchor } from "../WorkspaceSectionAnchor";
import { ZENITH_ANALYTICS_INC_ID } from "@/data/zenith-analytics-inc-seed";
import {
  useZenithContractChrome,
  ZenithContractChromeProvider,
} from "./zenith/ZenithContractChromeContext";
import { ZenithContractTabPanel } from "./zenith/ZenithContractTabPanel";
import { ZenithContractCommentsPanel } from "./zenith/ZenithContractCommentsPanel";

interface Props {
  contract: Contract;
  /** Session grace extension (late renewal), if any */
  graceExtension?: ContractGraceExtension;
  /** Callback to open the close pane (lifted to CustomerRevenueWorkspace) */
  onOpenClosePane?: () => void;
}

export function ContractStageContent({
  contract,
  graceExtension,
  onOpenClosePane,
}: Props) {
  if (contract.customerId === ZENITH_ANALYTICS_INC_ID) {
    return <ZenithContractBlankState />;
  }

  const { invoiceStatusOverrides } = useIngestContext();
  const billingScheduleView = useMemo(
    () => mergeBillingScheduleWithInvoiceOverrides(contract.billingSchedule, invoiceStatusOverrides),
    [contract.billingSchedule, invoiceStatusOverrides],
  );

  const canClose = contract.status === "Active" && !contract.closure;
  const hasClosure = !!contract.closure;
  const isClosing = contract.status === "Closing" && contract.closure;
  const inGrace = !!graceExtension && !graceExtension.resolved;

  const isTerminal = contract.status === "Closed" || contract.status === "Terminated";
  const isScheduled = contract.status === "Scheduled";
  const isExtended = contract.status === "Extended" || inGrace;
  const isActive = contract.status === "Active";

  const enforcementNeedsAttention =
    contract.enforcement.enforcementStatus === "Partial" ||
    contract.enforcement.enforcementStatus === "Pending" ||
    contract.enforcement.blockingIssues.length > 0 ||
    contract.enforcement.productMappingIssues.length > 0;

  const scrollToEnforcement = useCallback(() => {
    document.getElementById("ws-section-contract-enforcement")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  /**
   * Decide the (up to) two primary actions and the overflow set for the
   * current contract state.
   */
  const { primaryActions, overflowItems } = useMemo(() => {
    const overflow: OverflowItem[] = [];
    let primary: ReactNode = null;

    if (isTerminal || isClosing) {
      primary = (
        <>
          <ActionButton label="Contract PDF" />
        </>
      );
    } else if (isScheduled) {
      primary = (
        <>
          <ActionButton label="Contract PDF" />
          <ActionButton label="Create amendment" />
        </>
      );
    } else if (isExtended) {
      primary = (
        <>
          <ActionButton label="Contract PDF" />
          <ActionButton label="Create amendment" />
        </>
      );
      if (enforcementNeedsAttention) {
        overflow.push({ label: "Review enforcement", onClick: scrollToEnforcement });
      }
    } else if (isActive) {
      primary = (
        <>
          <ActionButton label="Contract PDF" />
          <ActionButton label="Create amendment" />
        </>
      );
      if (enforcementNeedsAttention) {
        overflow.push({ label: "Review enforcement", onClick: scrollToEnforcement });
      }
      if (canClose && onOpenClosePane) {
        overflow.push({
          label: "Close contract early",
          icon: XCircle,
          destructive: true,
          onClick: onOpenClosePane,
        });
      }
    } else {
      primary = (
        <>
          <ActionButton label="Contract PDF" />
          <ActionButton label="Create amendment" />
        </>
      );
    }

    return { primaryActions: primary, overflowItems: overflow };
  }, [
    canClose,
    enforcementNeedsAttention,
    isActive,
    isClosing,
    isExtended,
    isScheduled,
    isTerminal,
    onOpenClosePane,
    scrollToEnforcement,
  ]);

  return (
    <div className="relative flex flex-col gap-3">
      <RecordHeader actions={primaryActions} overflowItems={overflowItems} />

      {/* Closure banner for wind-down state */}
      {isClosing && contract.closure && (
        <ClosureBanner closure={contract.closure} />
      )}

      {/* Scheduled banner for incoming renewal contracts */}
      {contract.status === "Scheduled" && contract.scheduledStartDate && (
        <ScheduledBanner
          scheduledStartDate={contract.scheduledStartDate}
          replacesContractId={contract.replacesContractId}
        />
      )}

      {inGrace && graceExtension && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50/90 px-3 py-2 text-[12px] text-red-900">
          <p>
            <span className="font-semibold">Grace extension</span> active through {graceExtension.until}. Billing
            during grace: <span className="font-medium capitalize">{graceExtension.billingMode}</span>.
          </p>
        </div>
      )}

      <WorkspaceSectionAnchor id="ws-section-contract-overview">
        <ContractOverviewSection contract={contract} />
      </WorkspaceSectionAnchor>

      {hasClosure && contract.closure ? (
        <WorkspaceSectionAnchor id="ws-section-contract-closure">
          <ClosureSummaryCard
            closure={contract.closure}
            contractId={contract.id}
            customerId={contract.customerId}
          />
        </WorkspaceSectionAnchor>
      ) : null}

      <WorkspaceSectionAnchor id="ws-section-contract-terms">
        <ContractTermsSection products={contract.products} />
      </WorkspaceSectionAnchor>
      <ContractEnforcementSection enforcement={contract.enforcement} />
      <WorkspaceSectionAnchor id="ws-section-contract-billing">
        <ContractBillingSection schedule={billingScheduleView} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-contract-amendments">
        <ContractAmendmentsSection
          amendments={contract.amendments}
          renewalDate={contract.renewalDate}
          coTermBehavior={contract.coTermBehavior}
        />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-contract-finance">
        <ContractFinanceSection contract={contract} />
      </WorkspaceSectionAnchor>
      {contract.comparisonToQuote.length > 0 ? (
        <WorkspaceSectionAnchor id="ws-section-contract-differences">
          <ContractDifferencesSection differences={contract.comparisonToQuote} />
        </WorkspaceSectionAnchor>
      ) : null}
      <WorkspaceSectionAnchor id="ws-section-contract-documents">
        <ContractDocumentsSection contract={contract} />
      </WorkspaceSectionAnchor>
      <WorkspaceSectionAnchor id="ws-section-contract-timeline">
        <ContractTimelineSection timeline={contract.timeline} />
      </WorkspaceSectionAnchor>
    </div>
  );
}

function ZenithContractBlankState() {
  const chrome = useZenithContractChrome();
  if (chrome) {
    return <ZenithContractDetailView />;
  }

  // Ingest drawer / other shells render ContractStageContent outside the workspace provider.
  return (
    <ZenithContractChromeProvider enabled>
      <ZenithContractDetailView />
    </ZenithContractChromeProvider>
  );
}

function ZenithContractDetailView() {
  const chrome = useZenithContractChrome();
  if (!chrome) return null;

  const { activeTab } = chrome;

  return (
    <div className="mx-auto flex w-full max-w-[1020px] flex-col gap-3">
      <ZenithContractTabPanel activeTab={activeTab} />
      <ZenithContractCommentsPanel />
    </div>
  );
}
