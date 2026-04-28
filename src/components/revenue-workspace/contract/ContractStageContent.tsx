import { useRef, useEffect, useState } from "react";
import { LayoutList, MoreHorizontal, XCircle } from "lucide-react";
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
import { ClosureSummaryCard } from "@/components/contracts/ClosureSummaryCard";
import { ClosureBanner } from "@/components/contracts/ClosureBanner";
import { ScheduledBanner } from "@/components/contracts/ScheduledBanner";
import { cn } from "@/lib/utils";

interface Props {
  contract: Contract;
  onBack?: () => void;
  /** Callback to open the close pane (lifted to CustomerRevenueWorkspace) */
  onOpenClosePane?: () => void;
}

export function ContractStageContent({ contract, onBack, onOpenClosePane }: Props) {
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

  return (
    <div className="relative flex flex-col gap-4">
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
            {/* Overflow menu */}
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                  menuOpen
                    ? "border-border-default bg-surface-muted text-text-primary"
                    : "border-[#E4E5E8] bg-[#F0F1F3] text-text-secondary hover:border-border-default hover:bg-[#E8E9EC] hover:text-text-primary"
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
                      canClose
                        ? "text-red-600 hover:bg-red-50"
                        : "cursor-not-allowed text-text-muted"
                    )}
                  >
                    <XCircle size={14} />
                    Close contract early
                  </button>
                </div>
              )}
            </div>
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
      <ContractBillingSection schedule={contract.billingSchedule} />
      <ContractAmendmentsSection amendments={contract.amendments} renewalDate={contract.renewalDate} coTermBehavior={contract.coTermBehavior} />
      <ContractFinanceSection contract={contract} />
      <ContractDifferencesSection differences={contract.comparisonToQuote} />
      <ContractDocumentsSection contract={contract} />
      <ContractTimelineSection timeline={contract.timeline} />
    </div>
  );
}
