import { CircleCheck } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import type { ZenithContractContentTab } from "./zenith-contract-tabs";
import { cn } from "@/lib/utils";
import { useZenithStickyChromeHeight } from "./useZenithStickyChromeHeight";

const MANUAL_COMPLETE_TABS: ZenithContractContentTab[] = [
  "Billing info",
  "Addresses",
];

const markDoneButtonClass =
  "inline-flex h-8 items-center justify-center rounded-full border border-border-default bg-white px-4 text-[12px] font-medium text-text-secondary shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-text-primary";

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

  const stickyClass = cn(
    "sticky z-10 -mx-1 flex justify-end bg-gray-100/95 px-1 py-2 backdrop-blur-sm",
    className,
  );
  const stickyStyle = stickyChromeHeight > 0 ? { top: stickyChromeHeight } : undefined;

  if (isComplete) {
    return (
      <div className={stickyClass} style={stickyStyle}>
        <div className="inline-flex items-center gap-2">
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
    <div className={stickyClass} style={stickyStyle}>
      <button
        type="button"
        onClick={() => chrome.markTabComplete(tab)}
        className={markDoneButtonClass}
      >
        Mark as done
      </button>
    </div>
  );
}
