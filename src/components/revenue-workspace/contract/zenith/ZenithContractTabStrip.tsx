import { FileText, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import { ZenithContractReviewStatusMenu } from "./ZenithContractReviewStatusMenu";
import { ZenithContractTabStatusIcon } from "./ZenithContractTabStatusIcon";
import {
  ZENITH_CONTRACT_CONTENT_TABS,
  ZENITH_CONTRACT_DOCUMENT_TABS,
  type ZenithContractActiveTab,
  type ZenithContractContentTab,
} from "./zenith-contract-tabs";
import type { ZenithTabCompletionStatus } from "./zenith-contract-tab-status";

const DOCUMENT_TAB_MAX_WIDTH = "max-w-[200px]";

function ContentTabButton({
  tab,
  isActive,
  status,
  onClick,
}: {
  tab: ZenithContractContentTab;
  isActive: boolean;
  status: ZenithTabCompletionStatus;
  onClick: () => void;
}) {
  const isDisabled = status === "disabled";

  return (
    <button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-200",
        isDisabled && "cursor-not-allowed opacity-50",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-800",
      )}
    >
      {!isActive && <ZenithContractTabStatusIcon status={status} />}
      {tab}
    </button>
  );
}

function DocumentTabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "flex shrink items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-200",
        isActive
          ? "bg-blue-600 text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800",
        DOCUMENT_TAB_MAX_WIDTH,
      )}
    >
      <FileText size={14} strokeWidth={2} className={cn("shrink-0", isActive ? "text-white/80" : "text-slate-400")} aria-hidden />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

interface Props {
  activeTab: ZenithContractActiveTab;
  onTabSelect: (tab: ZenithContractActiveTab) => void;
  className?: string;
}

const tabStripChromeClass =
  "overflow-hidden rounded-2xl border border-border-default bg-white p-1.5";

const actionsStripChromeClass =
  "shrink-0 overflow-visible rounded-2xl border border-border-default bg-white p-1.5";

export function ZenithContractTabStrip({ activeTab, onTabSelect, className }: Props) {
  const chrome = useZenithContractChrome();

  function handlePreview() {
    onTabSelect("contract-pdf");
  }

  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center justify-center gap-3",
        className,
      )}
    >
      <div className={cn(tabStripChromeClass, "w-fit max-w-full")}>
        <div
          className={cn(
            "flex min-w-0 flex-nowrap items-center justify-center gap-1.5 overflow-x-auto",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {/* PDF/Document tabs - shown first */}
          {ZENITH_CONTRACT_DOCUMENT_TABS.map((tab) => (
            <DocumentTabButton
              key={tab.id}
              label={tab.label}
              isActive={tab.id === activeTab}
              onClick={() => onTabSelect(tab.id)}
            />
          ))}
          {/* Vertical divider to physically separate PDF tabs from flow tabs */}
          <div className="mx-2 h-6 w-px shrink-0 bg-slate-300" aria-hidden />
          {/* Flow tabs - Summary, Items, Billing info, Addresses, Invoice Preview */}
          {ZENITH_CONTRACT_CONTENT_TABS.map((tab) => (
            <ContentTabButton
              key={tab}
              tab={tab}
              isActive={tab === activeTab}
              status={chrome?.getContentTabStatus(tab) ?? "pending"}
              onClick={() => onTabSelect(tab)}
            />
          ))}
        </div>
      </div>

      <div className={actionsStripChromeClass}>
        <div className="flex items-center gap-2">
          <ZenithContractReviewStatusMenu />
          <div className="h-5 w-px shrink-0 bg-border-default" aria-hidden />
          <button
            type="button"
            onClick={handlePreview}
            className={cn(
              "inline-flex h-8 shrink-0 items-center justify-center rounded-full px-3.5",
              "text-[12px] font-medium text-white transition-colors",
              "bg-blue-600 hover:bg-blue-700",
            )}
          >
            Preview
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => chrome?.openCommentsPanel()}
        title="Comments"
        aria-label={
          (chrome?.commentCount ?? 0) > 0
            ? `Comments (${chrome?.commentCount})`
            : "Comments"
        }
        className={cn(
          "relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          "border border-border-default bg-white text-text-secondary",
          "transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-text-primary",
        )}
      >
        <MessageSquare size={15} strokeWidth={2} aria-hidden />
        {(chrome?.commentCount ?? 0) > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold leading-none text-white">
            {chrome?.commentCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
