import { CircleCheck } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import type { ZenithContractContentTab, ZenithContractActiveTab } from "./zenith-contract-tabs";
import { cn } from "@/lib/utils";
import { useZenithStickyChromeHeight } from "./useZenithStickyChromeHeight";

const MANUAL_COMPLETE_TABS: ZenithContractContentTab[] = [
  "Billing info",
  "Addresses",
];

/** Maps each tab to the next tab in the workflow sequence */
const NEXT_TAB_MAP: Partial<Record<ZenithContractContentTab, ZenithContractActiveTab>> = {
  "Billing info": "Addresses",
  "Addresses": "Invoice Preview", // Go to Invoice Preview when all review tabs are done
};

const markDoneButtonClass =
  "inline-flex h-8 items-center justify-center rounded-full border border-emerald-500 bg-emerald-600 px-4 text-[12px] font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700";

const stickyControlClass = "sticky z-10";

export function ZenithMarkTabDoneBar({
  tab,
  className,
}: {
  tab: ZenithContractContentTab;
  className?: string;
}) {
  const chrome = useZenithContractChrome();
  const stickyChromeHeight = useZenithStickyChromeHeight();
  if (!chrome || !MANUAL_COMPLETE_TABS.includes(tab)) return null;

  const isComplete = chrome.getContentTabStatus(tab) === "complete";
  const stickyStyle = stickyChromeHeight > 0 ? { top: stickyChromeHeight } : undefined;

  function handleMarkDone() {
    if (!chrome) return;
    chrome.markTabComplete(tab);
    const nextTab = NEXT_TAB_MAP[tab];
    if (nextTab) {
      chrome.setActiveTab(nextTab);
    }
  }

  if (isComplete) {
    return (
      <div className={cn("flex justify-end", className)}>
        <div
          className={cn(
            stickyControlClass,
            "inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 shadow-sm",
          )}
          style={stickyStyle}
        >
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-emerald-700">
            <CircleCheck size={14} strokeWidth={2.25} className="shrink-0" aria-hidden />
            Done
          </span>
          <button
            type="button"
            onClick={() => chrome.unmarkTabComplete(tab)}
            className="text-[12px] font-semibold text-[color:var(--color-info)] transition-colors hover:text-blue-700 hover:underline"
          >
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-end", className)}>
      <button
        type="button"
        onClick={handleMarkDone}
        className={cn(markDoneButtonClass, stickyControlClass)}
        style={stickyStyle}
      >
        Mark as done
      </button>
    </div>
  );
}
