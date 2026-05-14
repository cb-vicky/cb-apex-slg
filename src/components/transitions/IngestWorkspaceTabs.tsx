import { type ReactNode, useState } from "react";
import { FileText, MessageSquare, CheckCircle2, AlertCircle, LayoutList, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalCommentsCard } from "@/components/approvals/approval-comments";
import type { ApprovalComment } from "@/data/ingest-data";
import type { ValidationItem } from "./ValidationPanel";
import type { FieldSummaryItem } from "./ValidationPanel";

/** A document tab definition for PDF previews */
export interface DocumentTab {
  id: string;
  label: string;
  content: ReactNode;
}

interface IngestWorkspaceTabsProps {
  /** Main editable content (fields, details, etc.) */
  extractedFieldsContent: ReactNode;
  /** Array of document tabs (Contract PDF, Invoice PDF, etc.) */
  documentTabs?: DocumentTab[];
  /** Validation items for sidebar display */
  validationItems?: ValidationItem[];
  onValidationItemClick?: (id: string) => void;
  /** Summary items for sidebar display */
  summaryItems?: FieldSummaryItem[];
  comments: ApprovalComment[];
  onSubmitComment?: (text: string) => void;
  readOnly?: boolean;
  /** Label for the main fields tab */
  firstTabLabel?: string;
  /** All contracts tab content (passed directly from parent) */
  allContractsContent?: ReactNode;
  /** Show the All contracts tab */
  showAllContracts?: boolean;
  /** Whether All contracts tab is active */
  allContractsIsActive?: boolean;
  /** Click handler for All contracts tab */
  onAllContractsTabClick?: () => void;
  /** Called when user switches AWAY from All contracts (clicks another tab) */
  onAllContractsDeactivate?: () => void;
  /** Show back button in All contracts view */
  allContractsShowBack?: boolean;
  /** Back button click handler */
  onAllContractsBack?: () => void;
  /** Process summary title displayed above validations (e.g., "Early Renewal", "Contract about to expire") */
  processSummary?: string;
}

type TabId = string;

export function IngestWorkspaceTabs({
  extractedFieldsContent,
  documentTabs = [],
  validationItems = [],
  onValidationItemClick,
  summaryItems = [],
  comments,
  onSubmitComment,
  readOnly,
  firstTabLabel = "Extracted fields",
  allContractsContent,
  showAllContracts = false,
  allContractsIsActive = false,
  onAllContractsTabClick,
  onAllContractsDeactivate,
  allContractsShowBack = false,
  onAllContractsBack,
  processSummary,
}: IngestWorkspaceTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("extracted");
  
  // Use props directly instead of context for All contracts tab
  const showAllContractsTab = showAllContracts;
  const allContractsActive = allContractsIsActive;
  const showBackButton = allContractsShowBack;
  const onAllContractsClick = onAllContractsTabClick;
  const onBackClick = onAllContractsBack;

  const hasComments = comments.length > 0;
  const hasValidationIssues = validationItems.some(
    (i) => i.status === "warning" || i.status === "error"
  );
  const hasSidebar = summaryItems.length > 0 || validationItems.length > 0;

  const tabs: { id: TabId; label: string; icon: typeof FileText; badge?: boolean }[] = [
    ...documentTabs.map((dt) => ({
      id: dt.id,
      label: dt.label,
      icon: FileText,
    })),
    { id: "extracted", label: firstTabLabel, icon: FileText, badge: hasValidationIssues },
    { id: "discussions", label: "Discussions", icon: MessageSquare, badge: hasComments },
  ];

  const activeDocTab = documentTabs.find((dt) => dt.id === activeTab);

  // Handle tab click - if allContractsActive, clicking any other tab should deactivate it
  const handleTabClick = (tabId: TabId) => {
    if (allContractsActive && onAllContractsDeactivate) {
      // Switching away from All contracts
      onAllContractsDeactivate();
    }
    setActiveTab(tabId);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F3F4F6]">
      {/* Tab bar - flush with background, centered */}
      <div className="shrink-0 px-6 pt-9">
        <div className="relative flex items-end justify-center gap-6 border-b border-gray-200 pb-0">
          {/* Back button - positioned to the left */}
          {showBackButton && onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="absolute left-0 bottom-2 flex items-center gap-1 text-[12px] font-medium text-text-muted hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>
          )}
          
          {/* All contracts tab */}
          {showAllContractsTab && (
            <button
              type="button"
              onClick={onAllContractsClick}
              className={cn(
                "relative flex items-center gap-1.5 border-b-2 px-1 pb-2 -mb-px text-[13px] font-semibold transition-all",
                allContractsActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-text-muted hover:text-text-secondary",
              )}
            >
              <LayoutList size={14} strokeWidth={2} />
              <span>All contracts</span>
            </button>
          )}
          
          {/* Other tabs */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = !allContractsActive && activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center gap-1.5 border-b-2 px-1 pb-2 -mb-px text-[13px] font-semibold transition-all",
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-text-muted hover:text-text-secondary",
                )}
              >
                <Icon size={14} strokeWidth={2} />
                <span>{tab.label}</span>
                {tab.badge && !isActive && (
                  <span className="absolute -right-1 top-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto bg-[#F3F4F6]">
        {/* All contracts content */}
        {allContractsActive && allContractsContent && (
          <div className="min-h-full">{allContractsContent}</div>
        )}

        {!allContractsActive && activeDocTab && (
          <div className="min-h-full">{activeDocTab.content}</div>
        )}

        {!allContractsActive && activeTab === "extracted" && (
          <div className="flex min-h-full justify-center">
            {/* Summary/Validation sidebar - sticky, on the left */}
            {hasSidebar && (
              <div className="w-[170px] shrink-0 pt-5 pr-5">
                <div className="sticky top-5">
                  <SummarySidebar
                    summaryItems={summaryItems}
                    validationItems={validationItems}
                    onValidationItemClick={onValidationItemClick}
                    processSummary={processSummary}
                  />
                </div>
              </div>
            )}
            {/* Main content - centered */}
            <div className="w-full max-w-[520px] shrink-0">
              {extractedFieldsContent}
            </div>
            {/* Spacer to balance sidebar */}
            {hasSidebar && <div className="w-[150px] shrink-0" />}
          </div>
        )}

        {!allContractsActive && activeTab === "discussions" && (
          <div className="min-h-full px-6 py-4">
            <div className="mx-auto max-w-[520px]">
              <ApprovalCommentsCard
                id="ingest-discussions"
                comments={comments}
                onSubmitComment={readOnly ? undefined : onSubmitComment}
                listMaxHeightClass="max-h-[500px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummarySidebar({
  summaryItems,
  validationItems,
  onValidationItemClick,
  processSummary,
}: {
  summaryItems: FieldSummaryItem[];
  validationItems: ValidationItem[];
  onValidationItemClick?: (id: string) => void;
  processSummary?: string;
}) {
  const hasValidations = validationItems.length > 0;
  const hasSummary = summaryItems.length > 0;

  if (!hasValidations && !hasSummary && !processSummary) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Process summary title */}
      {processSummary && (
        <div className="flex flex-col gap-1">
          <p className="font-sora text-[24px] font-semibold text-text-primary leading-tight">
            {processSummary}
          </p>
        </div>
      )}

      {/* Validation items */}
      {hasValidations && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Validations
          </p>
          <div className="flex flex-col gap-1">
            {validationItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onValidationItemClick?.(item.id)}
                className={cn(
                  "flex items-start gap-1.5 rounded px-1.5 py-1 text-left text-[11px] transition-colors hover:bg-gray-200/60",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {item.status === "valid" && (
                    <CheckCircle2 size={11} className="text-emerald-500" />
                  )}
                  {item.status === "warning" && (
                    <AlertCircle size={11} className="text-amber-500" />
                  )}
                  {item.status === "error" && (
                    <AlertCircle size={11} className="text-red-500" />
                  )}
                  {item.status === "pending" && (
                    <span className="inline-block h-2 w-2 rounded-full bg-gray-300" />
                  )}
                </span>
                <span
                  className={cn(
                    "leading-tight",
                    item.status === "error"
                      ? "text-red-700"
                      : item.status === "warning"
                        ? "text-amber-700"
                        : "text-text-secondary",
                  )}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary - vertical label/value */}
      {hasSummary && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-text-muted">
            Summary
          </p>
          <div className="flex flex-col gap-2">
            {summaryItems.map((item) => (
              <div key={item.id} className="flex flex-col">
                <span className="text-[10px] text-text-muted">{item.label}</span>
                <span
                  className={cn(
                    "text-[12px] font-medium tabular-nums leading-tight",
                    item.status === "edited"
                      ? "text-blue-600"
                      : item.status === "computed"
                        ? "text-text-secondary"
                        : "text-text-primary",
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
