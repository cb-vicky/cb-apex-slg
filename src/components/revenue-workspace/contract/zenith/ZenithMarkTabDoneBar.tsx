import { CircleCheck, Info } from "lucide-react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import type { ZenithContractContentTab } from "./zenith-contract-tabs";
import { cn } from "@/lib/utils";

const TAB_REVIEW_LABEL: Partial<Record<ZenithContractContentTab, string>> = {
  "Billing info": "billing terms",
  Addresses: "addresses",
  "Additional info": "additional fields",
};

const stripBaseClass = "flex items-center gap-2 rounded-xl border px-3 py-2";

export function ZenithMarkTabDoneBar({ tab }: { tab: ZenithContractContentTab }) {
  const chrome = useZenithContractChrome();
  const reviewLabel = TAB_REVIEW_LABEL[tab];
  if (!chrome || !reviewLabel) return null;

  const status = chrome.getContentTabStatus(tab);
  const isComplete = status === "complete";

  if (isComplete) {
    return (
      <div
        className={cn(
          stripBaseClass,
          "justify-between gap-3 border-emerald-200 bg-emerald-50",
        )}
        role="status"
      >
        <div className="flex min-w-0 items-center gap-2">
          <CircleCheck size={14} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />
          <p className="text-[12px] font-medium text-emerald-800">Section marked as done</p>
        </div>
        <button
          type="button"
          onClick={() => chrome.unmarkTabComplete(tab)}
          className="shrink-0 text-[12px] font-semibold text-[color:var(--color-info)] transition-colors hover:text-blue-700 hover:underline"
        >
          Undo
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        stripBaseClass,
        "justify-between gap-3 border-amber-200 bg-amber-50/90",
      )}
      role="region"
      aria-label="Section review"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Info size={14} strokeWidth={2.25} className="shrink-0 text-amber-500" aria-hidden />
        <p className="min-w-0 truncate text-[12px] leading-tight text-amber-900">
          <span className="font-medium text-amber-950">Review required</span>
          <span className="text-amber-800/90"> — confirm {reviewLabel}, then mark done.</span>
        </p>
      </div>
      <button
        type="button"
        onClick={() => chrome.markTabComplete(tab)}
        className={cn(
          "inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-border-default",
          "bg-white px-3 text-[12px] font-medium text-[color:var(--color-info)] transition-colors",
          "hover:border-blue-200 hover:bg-blue-50/50",
        )}
      >
        Mark as done
      </button>
    </div>
  );
}
