import { useRef, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import { LayoutList, MoreHorizontal, XCircle } from "lucide-react";
import type { Contract } from "@/data/mock-data";
import type { ContractGraceExtension } from "@/data/contract-transition";
import { useIngestContext } from "@/context/IngestContext";
import { mergeBillingScheduleWithInvoiceOverrides } from "@/components/revenue-workspace/derive-stage-data";
import { openDrawer } from "@/store/drawer-store";
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
import { ClosureSummaryCard } from "@/components/contracts/ClosureSummaryCard";
import { ClosureBanner } from "@/components/contracts/ClosureBanner";
import { ScheduledBanner } from "@/components/contracts/ScheduledBanner";
import { cn } from "@/lib/utils";

interface Props {
  contract: Contract;
  /** Session grace extension (late renewal), if any */
  graceExtension?: ContractGraceExtension;
  onBack?: () => void;
  /** Callback to open the close pane (lifted to CustomerRevenueWorkspace) */
  onOpenClosePane?: () => void;
}

export function ContractStageContent({ contract, graceExtension, onBack, onOpenClosePane }: Props) {
  const { invoiceStatusOverrides } = useIngestContext();
  const billingScheduleView = useMemo(
    () => mergeBillingScheduleWithInvoiceOverrides(contract.billingSchedule, invoiceStatusOverrides),
    [contract.billingSchedule, invoiceStatusOverrides],
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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

  const showCloseOverflow = !isTerminal && !isClosing && !isScheduled;

  const headerMainActions = useMemo(() => {
    const pdf = <ActionButton key="pdf" label="Contract PDF" />;
    const transitionBtn = (
      <ActionButton
        key="transition"
        label="Transition"
        onClick={() =>
          openDrawer({
            entityType: "transition",
            mode: "transition",
            context: { customerId: contract.customerId, contractId: contract.id },
          })
        }
      />
    );
    const extendGraceBtn = (
      <ActionButton
        key="grace"
        label="Extend grace"
        onClick={() =>
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
          })
        }
      />
    );
    const resolveRenewalBtn = (
      <ActionButton
        key="resolve"
        label="Resolve renewal"
        onClick={() =>
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
          })
        }
      />
    );
    const amendmentBtn = <ActionButton key="amend" label="Create Amendment" />;
    const enforcementBtn = (
      <ActionButton key="enforce" label="Review enforcement" onClick={scrollToEnforcement} />
    );

    if (isTerminal) {
      return <>{pdf}</>;
    }
    if (isClosing) {
      return <>{pdf}</>;
    }
    if (isScheduled) {
      return (
        <>
          {transitionBtn}
          {pdf}
        </>
      );
    }
    if (isExtended) {
      const parts: ReactNode[] = [resolveRenewalBtn, transitionBtn, pdf];
      if (enforcementNeedsAttention) parts.splice(1, 0, enforcementBtn);
      return <>{parts}</>;
    }
    if (isActive) {
      const parts: ReactNode[] = [transitionBtn];
      if (!inGrace) parts.push(extendGraceBtn);
      parts.push(amendmentBtn, pdf);
      if (enforcementNeedsAttention) parts.splice(1, 0, enforcementBtn);
      return <>{parts}</>;
    }
    return (
      <>
        {transitionBtn}
        {amendmentBtn}
        {pdf}
      </>
    );
  }, [
    contract.customerId,
    contract.id,
    contract.status,
    enforcementNeedsAttention,
    inGrace,
    isActive,
    isClosing,
    isExtended,
    isScheduled,
    isTerminal,
    scrollToEnforcement,
  ]);

  const overflowMenu = showCloseOverflow ? (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
          menuOpen
            ? "border-border-default bg-surface-muted text-text-primary"
            : "border-gray-200 bg-gray-100 text-text-secondary hover:border-border-default hover:bg-gray-200 hover:text-text-primary",
        )}
        aria-label="More actions"
      >
        <MoreHorizontal size={14} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-48 rounded-lg border border-border-default bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenClosePane?.();
            }}
            disabled={!canClose}
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition-colors",
              canClose ? "text-red-600 hover:bg-red-50" : "cursor-not-allowed text-text-muted",
            )}
          >
            <XCircle size={14} />
            Close contract early
          </button>
        </div>
      )}
    </div>
  ) : null;

  return (
    <div className="relative flex flex-col gap-6">
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
            {headerMainActions}
            {overflowMenu}
          </>
        }
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
            onClick={() =>
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
              })
            }
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
