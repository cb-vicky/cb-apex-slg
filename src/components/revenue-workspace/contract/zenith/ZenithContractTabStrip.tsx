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

function tabButtonClass(isActive: boolean) {
  return cn(
    "rounded-lg px-2.5 py-1 text-[13px] font-medium transition-colors",
    isActive
      ? "border border-blue-200 bg-blue-50 text-blue-700 shadow-sm"
      : "border border-transparent bg-gray-50 text-text-secondary hover:bg-gray-100 hover:text-text-primary",
  );
}

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        tabButtonClass(isActive),
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap",
      )}
    >
      <ZenithContractTabStatusIcon status={status} />
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
        tabButtonClass(isActive),
        "flex shrink items-center gap-1.5",
        DOCUMENT_TAB_MAX_WIDTH,
      )}
    >
      <FileText size={14} strokeWidth={2} className="shrink-0 text-text-muted" aria-hidden />
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
          {ZENITH_CONTRACT_CONTENT_TABS.map((tab) => (
            <ContentTabButton
              key={tab}
              tab={tab}
              isActive={tab === activeTab}
              status={chrome?.getContentTabStatus(tab) ?? "pending"}
              onClick={() => onTabSelect(tab)}
            />
          ))}
          <div className="mx-1 h-5 w-px shrink-0 bg-border-default" aria-hidden />
          {ZENITH_CONTRACT_DOCUMENT_TABS.map((tab) => (
            <DocumentTabButton
              key={tab.id}
              label={tab.label}
              isActive={tab.id === activeTab}
              onClick={() => onTabSelect(tab.id)}
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
