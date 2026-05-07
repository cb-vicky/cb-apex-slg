import { useMemo, useCallback, type ReactNode } from "react";
import { LayoutList, XCircle } from "lucide-react";
import type { Contract } from "@/data/mock-data";
import type { ContractGraceExtension } from "@/data/contract-transition";
import { useIngestContext } from "@/context/IngestContext";
import { mergeBillingScheduleWithInvoiceOverrides } from "@/components/revenue-workspace/derive-stage-data";
import { openDrawer } from "@/store/drawer-store";
import { RecordHeader, type OverflowItem, type RecordHeaderOption } from "../RecordHeader";
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
import { currency, shortDate } from "@/lib/utils";

interface Props {
  contract: Contract;
  /** Session grace extension (late renewal), if any */
  graceExtension?: ContractGraceExtension;
  /** Other contracts under the same customer for the dropdown switcher. */
  customerContracts?: Contract[];
  onContractSelect?: (id: string) => void;
  onBack?: () => void;
  /** Callback to open the close pane (lifted to CustomerRevenueWorkspace) */
  onOpenClosePane?: () => void;
}

export function ContractStageContent({
  contract,
  graceExtension,
  customerContracts,
  onContractSelect,
  onBack,
  onOpenClosePane,
}: Props) {
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
    document.getElementById("workspace-contract-enforcement")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const openTransition = useCallback(() => {
    openDrawer({
      entityType: "transition",
      mode: "transition",
      context: { customerId: contract.customerId, contractId: contract.id },
    });
  }, [contract.customerId, contract.id]);

  const openExtendGrace = useCallback(() => {
    openDrawer({
      entityType: "transition",
      mode: "late_renewal",
      context: {
        customerId: contract.customerId,
        contractId: contract.id,
        latePhase: "extend",
      },
      flow: {
        scenario: "late_grace",
        step: "grace_extend",
        furthestUnlockedStep: "grace_extend",
        customerId: contract.customerId,
        contractId: contract.id,
        showStepper: true,
      },
    });
  }, [contract.customerId, contract.id]);

  const openResolveRenewal = useCallback(() => {
    openDrawer({
      entityType: "transition",
      mode: "late_renewal",
      context: {
        customerId: contract.customerId,
        contractId: contract.id,
        latePhase: "resolve",
      },
      flow: {
        scenario: "late_grace",
        step: "grace_extend",
        furthestUnlockedStep: "grace_extend",
        customerId: contract.customerId,
        contractId: contract.id,
        showStepper: true,
      },
    });
  }, [contract.customerId, contract.id]);

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
          <ActionButton label="Transition" onClick={openTransition} />
          <ActionButton label="Contract PDF" />
        </>
      );
    } else if (isExtended) {
      primary = (
        <>
          <ActionButton label="Resolve renewal" onClick={openResolveRenewal} />
          <ActionButton label="Transition" onClick={openTransition} />
        </>
      );
      overflow.push({ label: "Contract PDF" });
      if (enforcementNeedsAttention) {
        overflow.push({ label: "Review enforcement", onClick: scrollToEnforcement });
      }
    } else if (isActive) {
      primary = (
        <>
          <ActionButton label="Transition" onClick={openTransition} />
          <ActionButton label="Create amendment" />
        </>
      );
      overflow.push({ label: "Contract PDF" });
      if (enforcementNeedsAttention) {
        overflow.push({ label: "Review enforcement", onClick: scrollToEnforcement });
      }
      if (!inGrace) {
        overflow.push({ label: "Extend grace period", onClick: openExtendGrace });
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
          <ActionButton label="Transition" onClick={openTransition} />
          <ActionButton label="Create amendment" />
        </>
      );
      overflow.push({ label: "Contract PDF" });
    }

    return { primaryActions: primary, overflowItems: overflow };
  }, [
    canClose,
    enforcementNeedsAttention,
    inGrace,
    isActive,
    isClosing,
    isExtended,
    isScheduled,
    isTerminal,
    onOpenClosePane,
    openExtendGrace,
    openResolveRenewal,
    openTransition,
    scrollToEnforcement,
  ]);

  const recordOptions = useMemo<RecordHeaderOption[] | undefined>(() => {
    if (!customerContracts || customerContracts.length <= 1) return undefined;
    return customerContracts.map((c) => ({
      id: c.id,
      status: c.status,
      description: `${currency(c.tcv)} · ${c.term} · ${shortDate(c.effectiveDate)} – ${shortDate(c.endDate)}`,
    }));
  }, [customerContracts]);

  return (
    <div className="relative flex flex-col gap-3">
      <RecordHeader
        id={contract.id}
        recordOptions={recordOptions}
        onRecordSelect={onContractSelect}
        recordMenuTitle="Contracts for this customer"
        leadingAction={
          onBack ? <ActionButton icon={LayoutList} label="All contracts" onClick={onBack} /> : undefined
        }
        actions={primaryActions}
        overflowItems={overflowItems}
      />

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
          <button
            type="button"
            onClick={openResolveRenewal}
            className="shrink-0 rounded-md border border-red-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-red-800 hover:bg-red-100"
          >
            Resolve in drawer
          </button>
        </div>
      )}

      <ContractOverviewSection contract={contract} />

      {/* Closure summary card (after overview, when closure exists) */}
      {hasClosure && contract.closure && (
        <ClosureSummaryCard
          closure={contract.closure}
          contractId={contract.id}
          customerId={contract.customerId}
        />
      )}

      <ContractTermsSection products={contract.products} />
      <ContractEnforcementSection enforcement={contract.enforcement} />
      <ContractBillingSection schedule={billingScheduleView} />
      <ContractAmendmentsSection amendments={contract.amendments} renewalDate={contract.renewalDate} coTermBehavior={contract.coTermBehavior} />
      <ContractFinanceSection contract={contract} />
      <ContractDifferencesSection differences={contract.comparisonToQuote} />
      <ContractDocumentsSection contract={contract} />
      <ContractTimelineSection timeline={contract.timeline} />
    </div>
  );
}
