import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MoreHorizontal, RotateCcw, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import { getExtractedContract } from "@/data/ingest-data";
import {
  buildSessionContractFromIngestion,
  buildSessionInvoiceFromIngestion,
} from "@/data/ingestion-session";
import type { IngestionSession } from "@/context/ingest-context-core";
import { RecordHeader } from "../RecordHeader";
import { useZenithContractChrome } from "../contract/zenith/ZenithContractChromeContext";
import type { IngestionSubTab } from "./ingestion-zenith-sync";

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
  } = useIngestContext();

  const [showOverflow, setShowOverflow] = useState(false);
  const [showPreviewWarning, setShowPreviewWarning] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  const currentSub = (searchParams.get("sub") || "summary") as IngestionSubTab;
  const extracted = getExtractedContract(session.sampleId);
  const chrome = useZenithContractChrome();

  // Check if items are resolved (all mapped + billing gaps resolved)
  const itemsComplete = chrome?.getContentTabStatus("Items") === "complete";
  const isOnPreviewTab = currentSub === "invoice-preview";
  const previewEnabled = chrome?.getContentTabStatus("Invoice Preview") !== "disabled";

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

  // Auto-hide warning after 4 seconds
  useEffect(() => {
    if (!showPreviewWarning) return;
    const timer = setTimeout(() => setShowPreviewWarning(false), 4000);
    return () => clearTimeout(timer);
  }, [showPreviewWarning]);

  function handleNext() {
    // If on a document tab, go to Summary first
    if (currentSub.startsWith("pdf-") || currentSub === "contract-preview") {
      navigateToTab("summary");
      return;
    }

    const currentIndex = TAB_FLOW_ORDER.indexOf(currentSub);
    
    // If on addresses and going to preview, check if items are resolved
    if (currentSub === "addresses" && !previewEnabled) {
      // Still go to preview but show the warning
      navigateToTab("invoice-preview");
      setShowPreviewWarning(true);
      return;
    }

    // If on preview and items not resolved, show warning
    if (currentSub === "invoice-preview" && !itemsComplete) {
      setShowPreviewWarning(true);
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
      if (tab === "invoice-preview") {
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
  const isLastTabWithItemsComplete = isOnPreviewTab && itemsComplete;
  const ctaLabel = isLastTabWithItemsComplete ? "Send for approval" : "Next";
  const ctaAction = isLastTabWithItemsComplete ? handleSendForApproval : handleNext;
  const ctaDisabled = isOnPreviewTab && !itemsComplete;

  return (
    <RecordHeader
      actions={
        <div className="flex items-center gap-2">
          {/* Warning message for preview */}
          {showPreviewWarning && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-[12px] font-medium text-amber-700 animate-in fade-in slide-in-from-right-2 duration-200">
              <AlertCircle size={14} className="shrink-0" />
              <span>Preview cannot be generated. Resolve missing items.</span>
            </div>
          )}

          {/* Ellipsis menu */}
          {!isApproverReview && (
            <div ref={overflowRef} className="relative">
              <button
                type="button"
                onClick={() => setShowOverflow((o) => !o)}
                aria-label="More actions"
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                  showOverflow
                    ? "bg-gray-100 text-gray-700"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                )}
              >
                <MoreHorizontal size={18} strokeWidth={2} />
              </button>
              {showOverflow && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-border-default bg-white py-1 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
                  >
                    <RotateCcw size={14} className="shrink-0" />
                    <span>Restart ingestion</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscard}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>Discard contract</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Primary CTA */}
          <button
            type="button"
            onClick={ctaAction}
            disabled={ctaDisabled && !showPreviewWarning}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-full px-5 text-[13px] font-semibold transition-colors",
              isLastTabWithItemsComplete
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : ctaDisabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700",
            )}
          >
            {ctaLabel}
          </button>
        </div>
      }
    />
  );
}
