import { useState } from "react";
import { CheckCircle2, AlertCircle, MessageSquare, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApprovalCommentsCard } from "@/components/approvals/approval-comments";
import type { ApprovalComment } from "@/data/ingest-data";

export interface ValidationItem {
  id: string;
  label: string;
  status: "valid" | "warning" | "error" | "pending";
  hint?: string;
}

interface ValidationPanelProps {
  title: string;
  items: ValidationItem[];
  onItemClick: (id: string) => void;
  activeItemId?: string;
  comments?: ApprovalComment[];
  onSubmitComment?: (text: string) => void;
  commentsTitle?: string;
  className?: string;
}

export function ValidationPanel({
  title,
  items,
  onItemClick,
  activeItemId,
  comments,
  onSubmitComment,
  commentsTitle = "Discussion",
  className,
}: ValidationPanelProps) {
  const [showComments, setShowComments] = useState(false);
  const hasComments = comments && comments.length > 0;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-gray-50 px-4 py-2.5">
        <h3 className="text-[12px] font-semibold text-text-primary">{showComments ? commentsTitle : title}</h3>
        {comments !== undefined && (
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              showComments
                ? "bg-gray-200 text-text-primary"
                : "text-text-muted hover:bg-gray-100 hover:text-text-primary",
            )}
            title={showComments ? "Show validations" : "Show comments"}
          >
            {showComments ? <X size={14} /> : <MessageSquare size={14} />}
            {!showComments && hasComments && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-info)] text-[9px] font-bold text-white">
                {comments.length}
              </span>
            )}
          </button>
        )}
      </div>

      {showComments && comments !== undefined ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
          <ApprovalCommentsCard
            id="validation-panel-comments"
            comments={comments}
            onSubmitComment={onSubmitComment}
            listMaxHeightClass="max-h-[calc(100vh-300px)]"
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <nav className="flex flex-col py-1">
            {items.map((item) => {
              const isActive = activeItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onItemClick(item.id)}
                  className={cn(
                    "group flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-white border-l-2 border-[color:var(--color-info)]"
                      : "border-l-2 border-transparent hover:bg-white/60",
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                    {item.status === "valid" && (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    )}
                    {item.status === "warning" && (
                      <AlertCircle size={16} className="text-amber-500" />
                    )}
                    {item.status === "error" && (
                      <AlertCircle size={16} className="text-red-500" />
                    )}
                    {item.status === "pending" && (
                      <span className="h-2 w-2 rounded-full bg-gray-300" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px] font-medium",
                        isActive ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary",
                      )}
                    >
                      {item.label}
                    </span>
                    {item.hint && (
                      <span className="block truncate text-[11px] text-text-muted">{item.hint}</span>
                    )}
                  </div>
                  <ChevronRight
                    size={14}
                    className={cn(
                      "shrink-0 transition-opacity",
                      isActive ? "text-text-muted opacity-100" : "opacity-0 group-hover:opacity-60",
                    )}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}

export interface FieldSummaryItem {
  id: string;
  label: string;
  value: string;
  status?: "normal" | "edited" | "computed";
}

interface FieldSummaryPanelProps {
  title: string;
  items: FieldSummaryItem[];
  onItemClick?: (id: string) => void;
  activeItemId?: string;
  comments?: ApprovalComment[];
  onSubmitComment?: (text: string) => void;
  commentsTitle?: string;
  footer?: React.ReactNode;
  className?: string;
}

export function FieldSummaryPanel({
  title,
  items,
  onItemClick,
  activeItemId,
  comments,
  onSubmitComment,
  commentsTitle = "Discussion",
  footer,
  className,
}: FieldSummaryPanelProps) {
  const [showComments, setShowComments] = useState(false);
  const hasComments = comments && comments.length > 0;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-gray-50 px-4 py-2.5">
        <h3 className="text-[12px] font-semibold text-text-primary">{showComments ? commentsTitle : title}</h3>
        {comments !== undefined && (
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-md transition-colors",
              showComments
                ? "bg-gray-200 text-text-primary"
                : "text-text-muted hover:bg-gray-100 hover:text-text-primary",
            )}
            title={showComments ? "Show summary" : "Show comments"}
          >
            {showComments ? <X size={14} /> : <MessageSquare size={14} />}
            {!showComments && hasComments && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-info)] text-[9px] font-bold text-white">
                {comments.length}
              </span>
            )}
          </button>
        )}
      </div>

      {showComments && comments !== undefined ? (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-4">
          <ApprovalCommentsCard
            id="field-summary-comments"
            comments={comments}
            onSubmitComment={onSubmitComment}
            listMaxHeightClass="max-h-[calc(100vh-300px)]"
          />
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
            <div className="flex flex-col divide-y divide-border-subtle">
              {items.map((item) => {
                const isActive = activeItemId === item.id;
                const isClickable = onItemClick !== undefined;
                const Wrapper = isClickable ? "button" : "div";
                return (
                  <Wrapper
                    key={item.id}
                    type={isClickable ? "button" : undefined}
                    onClick={isClickable ? () => onItemClick(item.id) : undefined}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 text-left",
                      isClickable && "transition-colors hover:bg-white/60",
                      isActive && "bg-white",
                    )}
                  >
                    <span className="text-[12px] text-text-muted">{item.label}</span>
                    <span
                      className={cn(
                        "text-right text-[13px] font-medium tabular-nums",
                        item.status === "computed"
                          ? "text-text-muted"
                          : item.status === "edited"
                            ? "text-[color:var(--color-info)]"
                            : "text-text-primary",
                      )}
                    >
                      {item.value}
                    </span>
                  </Wrapper>
                );
              })}
            </div>
          </div>
          {footer && (
            <div className="shrink-0 border-t border-border-subtle bg-gray-50 px-4 py-3">
              {footer}
            </div>
          )}
        </>
      )}
    </div>
  );
}
