import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  ClipboardCheck,
  MessageSquare,
  PanelRightClose,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalCommentsCard } from "@/components/approvals/approval-comments";
import type { ApprovalComment } from "@/data/ingest-data";

export interface ValidationItem {
  id: string;
  label: string;
  status: "valid" | "warning" | "error" | "pending";
  hint?: string;
}

export interface SummaryItem {
  id: string;
  label: string;
  value: string;
  status?: "normal" | "edited" | "computed";
}

type RailTab = "validations" | "comments";

interface DrawerInsightRailProps {
  variant: "validation" | "summary";
  title: string;
  validationItems?: ValidationItem[];
  summaryItems?: SummaryItem[];
  onItemClick?: (id: string) => void;
  activeItemId?: string;
  comments?: ApprovalComment[];
  onSubmitComment?: (text: string) => void;
  commentsTitle?: string;
  className?: string;
}

const PANEL_WIDTH = 300;

export function DrawerInsightRail({
  variant,
  title,
  validationItems = [],
  summaryItems = [],
  onItemClick,
  activeItemId,
  comments = [],
  onSubmitComment,
  commentsTitle = "Discussion",
  className,
}: DrawerInsightRailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RailTab>("validations");

  const hasValidationUpdates = validationItems.some(
    (i) => i.status === "warning" || i.status === "error"
  );
  const hasCommentUpdates = comments.length > 0;

  function openPanelAt(tab: RailTab) {
    setActiveTab(tab);
    setIsOpen(true);
  }

  function closeRail() {
    setIsOpen(false);
  }

  // Push content to the left when panel is open
  useEffect(() => {
    const container = document.querySelector<HTMLElement>("[data-drawer-fields-container]");
    if (!container) return;
    
    const inner = container.querySelector<HTMLElement>("[data-drawer-fields-inner]");
    
    if (isOpen) {
      container.style.paddingRight = `${PANEL_WIDTH}px`;
      if (inner) {
        inner.style.marginLeft = "0";
        inner.style.marginRight = "auto";
      }
    } else {
      container.style.paddingRight = "";
      if (inner) {
        inner.style.marginLeft = "auto";
        inner.style.marginRight = "auto";
      }
    }
    return () => {
      container.style.paddingRight = "";
      if (inner) {
        inner.style.marginLeft = "auto";
        inner.style.marginRight = "auto";
      }
    };
  }, [isOpen]);

  return (
    <>
      {/* === Floating icon stack (visible when panel is closed) === */}
      <div
        aria-hidden={isOpen}
        className={cn(
          "absolute right-4 top-4 z-10 transition-opacity duration-150",
          isOpen ? "pointer-events-none opacity-0" : "opacity-100",
          className,
        )}
        data-drawer-rail-container
      >
        <div className="flex flex-col items-center gap-1.5 rounded-full border border-border-default bg-white p-1 shadow-[0_4px_12px_-4px_rgba(17,24,39,0.15)]">
          <RailIconButton
            icon={ClipboardCheck}
            label={title}
            hasUpdates={hasValidationUpdates}
            onClick={() => openPanelAt("validations")}
          />
          <RailIconButton
            icon={MessageSquare}
            label={commentsTitle}
            hasUpdates={hasCommentUpdates}
            onClick={() => openPanelAt("comments")}
          />
        </div>
      </div>

      {/* === Panel === */}
      <div
        aria-hidden={!isOpen}
        className={cn(
          "absolute right-0 top-0 bottom-0 z-10 flex flex-col overflow-hidden border-l border-border-default bg-white shadow-[-4px_0_16px_-8px_rgba(17,24,39,0.12)] transition-all duration-200 ease-out",
          isOpen ? "pointer-events-auto translate-x-0 opacity-100" : "pointer-events-none translate-x-2 opacity-0",
        )}
        style={{ width: PANEL_WIDTH }}
      >
        {/* Panel header with tabs */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border-subtle bg-gray-50/80 px-2 py-1.5">
          <div className="flex flex-1 items-center gap-0.5">
            <TabButton
              icon={ClipboardCheck}
              label={title}
              hasUpdates={hasValidationUpdates}
              active={activeTab === "validations"}
              onClick={() => setActiveTab("validations")}
            />
            <TabButton
              icon={MessageSquare}
              label={commentsTitle}
              hasUpdates={hasCommentUpdates}
              active={activeTab === "comments"}
              onClick={() => setActiveTab("comments")}
            />
          </div>
          <button
            type="button"
            onClick={closeRail}
            aria-label="Collapse"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-white hover:text-text-primary"
          >
            <PanelRightClose size={14} />
          </button>
        </div>

        {/* Tab content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {activeTab === "validations" && (
            variant === "validation" ? (
              <ValidationBody
                items={validationItems}
                onItemClick={onItemClick}
                activeItemId={activeItemId}
              />
            ) : (
              <SummaryBody items={summaryItems} />
            )
          )}
          {activeTab === "comments" && (
            <ApprovalCommentsCard
              id="drawer-rail-comments"
              comments={comments}
              onSubmitComment={onSubmitComment}
              listMaxHeightClass="max-h-[400px]"
            />
          )}
        </div>
      </div>
    </>
  );
}

function RailIconButton({
  icon: Icon,
  label,
  hasUpdates,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  hasUpdates?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group/ib relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
    >
      <Icon size={15} strokeWidth={1.9} />
      {hasUpdates && (
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-red-500" />
      )}
      <Tooltip>{label}</Tooltip>
    </button>
  );
}

function TabButton({
  icon: Icon,
  label,
  hasUpdates,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  hasUpdates?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "bg-white text-text-primary shadow-sm"
          : "text-text-muted hover:bg-white/60 hover:text-text-secondary",
      )}
    >
      <Icon size={13} strokeWidth={1.9} />
      <span>{label}</span>
      {hasUpdates && !active && (
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
      )}
    </button>
  );
}

function Tooltip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-full top-1/2 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[10px] font-medium leading-none text-white opacity-0 shadow-md transition-opacity",
        "group-hover/ib:opacity-100",
      )}
    >
      {children}
    </span>
  );
}

function ValidationBody({
  items,
  onItemClick,
  activeItemId,
}: {
  items: ValidationItem[];
  onItemClick?: (id: string) => void;
  activeItemId?: string;
}) {
  if (items.length === 0) {
    return <p className="text-[12px] text-text-muted">No validation items.</p>;
  }
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => {
        const isActive = activeItemId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onItemClick?.(item.id)}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
              isActive
                ? "bg-white ring-1 ring-border-default shadow-sm"
                : "hover:bg-gray-50",
            )}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {item.status === "valid" && (
                <CheckCircle2 size={14} className="text-emerald-500" />
              )}
              {item.status === "warning" && (
                <AlertCircle size={14} className="text-amber-500" />
              )}
              {item.status === "error" && (
                <AlertCircle size={14} className="text-red-500" />
              )}
              {item.status === "pending" && (
                <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "block truncate text-[12px] font-medium",
                  isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
                )}
              >
                {item.label}
              </span>
              {item.hint && (
                <span className="block truncate text-[10px] text-text-muted">{item.hint}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function SummaryBody({ items }: { items: SummaryItem[] }) {
  if (items.length === 0) {
    return <p className="text-[12px] text-text-muted">No summary items.</p>;
  }
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between gap-2 py-1">
          <span className="text-[11px] text-text-muted">{item.label}</span>
          <span
            className={cn(
              "text-right text-[12px] font-medium tabular-nums",
              item.status === "computed"
                ? "text-text-muted"
                : item.status === "edited"
                  ? "text-[color:var(--color-info)]"
                  : "text-text-primary",
            )}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
