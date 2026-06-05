import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, RotateCcw, Trash2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { getExtractedContract } from "@/data/ingest-data";
import {
  buildSessionContractFromIngestion,
  buildSessionInvoiceFromIngestion,
} from "@/data/ingestion-session";
import type { IngestionSession, IngestionOperatorStatus } from "@/context/ingest-context-core";
import { RecordHeader } from "../RecordHeader";
import { useZenithContractChrome } from "../contract/zenith/ZenithContractChromeContext";
import type { IngestionSubTab } from "./ingestion-zenith-sync";

// ---------------------------------------------------------------------------
// Operator Status Tag Configuration
// ---------------------------------------------------------------------------

const OPERATOR_STATUS_OPTIONS: {
  value: IngestionOperatorStatus;
  label: string;
  color: "amber" | "blue" | "red" | "gray";
}[] = [
  { value: "in_review", label: "In review", color: "blue" },
  { value: "awaiting_data", label: "Awaiting Data", color: "amber" },
  { value: "on_hold", label: "On hold", color: "gray" },
  { value: "needs_clarification", label: "Needs clarification", color: "red" },
];

const STATUS_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  amber: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  gray: { bg: "bg-gray-100", text: "text-gray-600", border: "border-gray-200" },
};

function getStatusConfig(status: IngestionOperatorStatus | undefined) {
  if (!status) return null;
  return OPERATOR_STATUS_OPTIONS.find((o) => o.value === status) ?? null;
}

interface Props {
  session: IngestionSession;
  customerId: string;
}

/** Tab flow order for Next cycling */
const TAB_FLOW_ORDER: IngestionSubTab[] = [
  "summary",
  "items",
  "billing",
  "addresses",
  "subscription-preview",
  "invoice-preview",
];

/**
 * Ingestion-stage actions — floating action bar with ellipsis menu and Next/Send for approval CTA.
 * 
 * Cycles through tabs: Summary → Items → Billing Info → Addresses → Preview
 * - If items not resolved on Preview, shows warning message
 * - When items resolved on Preview, shows "Send for approval"
 */
export function IngestionActions({ session, customerId }: Props) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { persona } = useDemoPersona();
  const {
    discardIngestion,
    restartIngestion,
    applyQueueItemOverride,
    addSessionContract,
    addSessionInvoice,
    submitInvoiceForApproval,
    setIngestionOverallStatus,
    setInvoiceStatusOverride,
    setIngestionOperatorStatus,
  } = useIngestContext();

  const [showOverflow, setShowOverflow] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  const currentSub = (searchParams.get("sub") || "summary") as IngestionSubTab;
  const extracted = getExtractedContract(session.sampleId);
  const chrome = useZenithContractChrome();

  // Check if items are resolved (all mapped + billing gaps resolved)
  const itemsComplete = chrome?.getContentTabStatus("Items") === "complete";
  const isOnSubscriptionPreview = currentSub === "subscription-preview";
  const isOnInvoicePreview = currentSub === "invoice-preview";
  const subscriptionPreviewEnabled = chrome?.getContentTabStatus("Subscription Preview") !== "disabled";

  // Close overflow menu on outside click
  useEffect(() => {
    if (!showOverflow) return;
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOverflow]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (!showStatusDropdown) return;
    function handleClickOutside(e: MouseEvent) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setShowStatusDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusDropdown]);

  const currentStatusConfig = getStatusConfig(session.operatorStatus);

  function handleStatusChange(status: IngestionOperatorStatus) {
    setIngestionOperatorStatus(session.queueItemId, status);
    setShowStatusDropdown(false);
  }

  function handleNext() {
    // If on a document tab, go to Summary first
    if (currentSub.startsWith("pdf-") || currentSub === "contract-preview") {
      navigateToTab("summary");
      return;
    }

    const currentIndex = TAB_FLOW_ORDER.indexOf(currentSub);
    
    // If on addresses and going to subscription preview, check if items are resolved
    if (currentSub === "addresses" && !subscriptionPreviewEnabled) {
      // Still go to subscription preview (will show disabled message)
      navigateToTab("subscription-preview");
      return;
    }

    // If on subscription preview and items not resolved, do nothing
    if (currentSub === "subscription-preview" && !itemsComplete) {
      return;
    }

    // If on invoice preview and items not resolved, do nothing
    if (currentSub === "invoice-preview" && !itemsComplete) {
      return;
    }

    // Cycle to next tab
    if (currentIndex >= 0 && currentIndex < TAB_FLOW_ORDER.length - 1) {
      const nextTab = TAB_FLOW_ORDER[currentIndex + 1];
      navigateToTab(nextTab);
    } else if (currentIndex === -1) {
      // Fallback: if not found in flow, start from Summary
      navigateToTab("summary");
    }
  }

  function navigateToTab(tab: IngestionSubTab) {
    if (chrome) {
      // Use zenith chrome to navigate tabs
      if (tab === "subscription-preview") {
        chrome.setActiveTab("Subscription Preview");
      } else if (tab === "invoice-preview") {
        chrome.setActiveTab("Invoice Preview");
      } else if (tab === "summary") {
        chrome.setActiveTab("Summary");
      } else if (tab === "items") {
        chrome.setActiveTab("Items");
      } else if (tab === "billing") {
        chrome.setActiveTab("Billing info");
      } else if (tab === "addresses") {
        chrome.setActiveTab("Addresses");
      }
    }
    const params = new URLSearchParams(searchParams);
    params.set("sub", tab);
    params.set("frame", "1");
    setSearchParams(params);
  }

  function handleRestart() {
    restartIngestion(session.queueItemId);
    navigateToTab("summary");
    setShowOverflow(false);
  }

  function handleDiscard() {
    discardIngestion(session.queueItemId);
    applyQueueItemOverride(session.queueItemId, { status: "Rejected" });
    navigate(`/customers/${customerId}`);
    setShowOverflow(false);
  }

  function handleSendForApproval() {
    const contract = buildSessionContractFromIngestion(extracted, customerId);
    const invoice = buildSessionInvoiceFromIngestion(extracted, customerId, contract.id);

    addSessionContract(contract);
    addSessionInvoice(invoice);

    submitInvoiceForApproval(invoice.id, {
      customerId,
      customerName: extracted.customerName,
      invoiceAmount: invoice.amount,
      invoiceDate: invoice.date,
      ingestId: session.queueItemId,
    });

    setInvoiceStatusOverride(invoice.id, "Pending Approval");

    applyQueueItemOverride(session.queueItemId, {
      status: "Ingested",
      contractId: contract.id,
      invoiceId: invoice.id,
      customerId,
    });

    setIngestionOverallStatus(session.queueItemId, "awaiting_approval");

    navigate(`/customers/${customerId}?tab=invoicing&invoiceId=${invoice.id}`);
  }

  const isApproverReview =
    persona === "approver" && session.overallStatus === "awaiting_approval";

  // Determine CTA label and action
  // "Send for approval" only shows on Invoice Preview when items are complete
  const isLastTabWithItemsComplete = isOnInvoicePreview && itemsComplete;
  const ctaLabel = isLastTabWithItemsComplete ? "Send for approval" : "Next";
  const ctaAction = isLastTabWithItemsComplete ? handleSendForApproval : handleNext;
  // Disable Next on subscription preview or invoice preview if items not resolved
  const ctaDisabled = (isOnSubscriptionPreview || isOnInvoicePreview) && !itemsComplete;

  // Show status dropdown as separate button only when items NOT complete
  const showStatusAsSeparateButton = !isApproverReview && !itemsComplete;

  return (
    <RecordHeader
      actions={
        <div className="flex items-center gap-2">
          {/* Operator Status Tag Dropdown - only when items not resolved */}
          {showStatusAsSeparateButton && (
            <div ref={statusDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setShowStatusDropdown((o) => !o)}
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-all",
                  currentStatusConfig
                    ? cn(
                        STATUS_COLOR_CLASSES[currentStatusConfig.color].bg,
                        STATUS_COLOR_CLASSES[currentStatusConfig.color].text,
                        STATUS_COLOR_CLASSES[currentStatusConfig.color].border,
                      )
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50",
                )}
              >
                <span>{currentStatusConfig?.label ?? "Set status"}</span>
                <ChevronDown size={11} className={cn("transition-transform", showStatusDropdown && "rotate-180")} />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-44 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                  {OPERATOR_STATUS_OPTIONS.map((option) => {
                    const colors = STATUS_COLOR_CLASSES[option.color];
                    const isSelected = session.operatorStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleStatusChange(option.value)}
                        className={cn(
                          "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors",
                          isSelected ? "bg-gray-50" : "hover:bg-gray-50",
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", colors.bg.replace("bg-", "bg-").replace("-100", "-500"))} />
                        <span className={isSelected ? "font-medium text-text-primary" : "text-text-primary"}>
                          {option.label}
                        </span>
                        {isSelected && <span className="ml-auto text-blue-600 text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Primary CTA - same height as status tag */}
          <button
            type="button"
            onClick={ctaAction}
            disabled={ctaDisabled}
            className={cn(
              "inline-flex h-7 items-center justify-center rounded-full px-4 text-[12px] font-semibold transition-colors",
              isLastTabWithItemsComplete
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : ctaDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            {ctaLabel}
          </button>

          {/* Ellipsis menu */}
          {!isApproverReview && (
            <div ref={overflowRef} className="relative">
              <button
                type="button"
                onClick={() => setShowOverflow((o) => !o)}
                aria-label="More actions"
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                  showOverflow
                    ? "border-gray-300 bg-gray-100 text-gray-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                )}
              >
                <MoreHorizontal size={14} strokeWidth={2} />
              </button>
              {showOverflow && (
                <div className="absolute right-0 top-[calc(100%+4px)] z-30 w-48 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Status submenu - only when items are resolved */}
                  {itemsComplete && (
                    <>
                      <div className="px-2.5 py-1.5">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Status</p>
                      </div>
                      {OPERATOR_STATUS_OPTIONS.map((option) => {
                        const colors = STATUS_COLOR_CLASSES[option.color];
                        const isSelected = session.operatorStatus === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              handleStatusChange(option.value);
                              setShowOverflow(false);
                            }}
                            className={cn(
                              "flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors",
                              isSelected ? "bg-gray-50" : "hover:bg-gray-50",
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", colors.bg.replace("bg-", "bg-").replace("-100", "-500"))} />
                            <span className={isSelected ? "font-medium text-text-primary" : "text-text-primary"}>
                              {option.label}
                            </span>
                            {isSelected && <span className="ml-auto text-blue-600 text-[10px]">✓</span>}
                          </button>
                        );
                      })}
                      <div className="my-1 border-t border-border-default" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] text-text-primary transition-colors hover:bg-surface-muted"
                  >
                    <RotateCcw size={12} className="shrink-0" />
                    <span>Restart ingestion</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={12} className="shrink-0" />
                    <span>Discard contract</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
}
