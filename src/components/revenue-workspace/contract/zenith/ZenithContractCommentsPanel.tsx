import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Pin, PinOff, X } from "lucide-react";
import { ApprovalCommentInput } from "@/components/approvals/approval-comments";
import {
  sortZenithComments,
  zenithCommentTabLabel,
  type ZenithContractComment,
} from "@/data/zenith-contract-comments";
import { cn, shortDate } from "@/lib/utils";
import { useZenithContractChrome } from "./ZenithContractChromeContext";

function highlightMentions(text: string) {
  const parts = text.split(/(@\w[\w\s]*)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="rounded bg-blue-50 px-0.5 font-medium text-blue-700">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function CommentListItem({
  comment,
  onTogglePin,
  onNavigate,
}: {
  comment: ZenithContractComment;
  onTogglePin: (id: string) => void;
  onNavigate: (comment: ZenithContractComment) => void;
}) {
  const initials = comment.author
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <article className="border-b border-border-subtle px-5 py-4 last:border-0">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onNavigate(comment)}
          className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          {zenithCommentTabLabel(comment.tab)}
        </button>
        <span className="text-[11px] text-text-muted">·</span>
        <button
          type="button"
          onClick={() => onNavigate(comment)}
          className="truncate text-[11px] font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {comment.anchorLabel}
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(comment.id)}
          className={cn(
            "ml-auto inline-flex shrink-0 items-center rounded-md p-1 transition-colors",
            comment.pinned
              ? "text-blue-600 hover:bg-blue-50"
              : "text-text-muted hover:bg-gray-100 hover:text-text-secondary",
          )}
          title={comment.pinned ? "Unpin comment" : "Pin comment"}
          aria-label={comment.pinned ? "Unpin comment" : "Pin comment"}
        >
          {comment.pinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
        </button>
      </div>
      <div className="flex gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#012A38] text-[10px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[13px] font-semibold text-text-primary">{comment.author}</span>
            <span className="ml-auto shrink-0 text-[11px] text-text-muted">
              {shortDate(comment.timestamp)}
            </span>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">
            {highlightMentions(comment.text)}
          </p>
        </div>
      </div>
    </article>
  );
}

export function ZenithContractCommentsPanel() {
  const chrome = useZenithContractChrome();
  const composerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chrome?.commentsPanelOpen) return;
    const { closeCommentsPanel } = chrome;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCommentsPanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [chrome]);

  useEffect(() => {
    if (chrome?.commentsPanelOpen && chrome.commentFocus) {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [chrome?.commentsPanelOpen, chrome?.commentFocus]);

  if (!chrome?.commentsPanelOpen) return null;

  const { comments, commentFocus, activeTab, commentCount } = chrome;
  const sorted = sortZenithComments(comments);
  const composerTab = commentFocus?.tab ?? activeTab;
  const composerAnchor = commentFocus?.anchorLabel ?? "General";

  function handleSubmit(text: string) {
    chrome?.addComment({
      tab: composerTab,
      anchorLabel: composerAnchor,
      text,
    });
  }

  function handleNavigate(comment: ZenithContractComment) {
    chrome?.setActiveTab(comment.tab);
    chrome?.openCommentsPanel({ tab: comment.tab, anchorLabel: comment.anchorLabel });
  }

  return createPortal(
    <div className="fixed inset-0 z-[55] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/20"
        aria-label="Close comments"
        onClick={() => chrome.closeCommentsPanel()}
      />
      <aside
        className="relative flex h-full w-full max-w-[420px] flex-col border-l border-border-default bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.08)]"
        role="dialog"
        aria-labelledby="zenith-comments-panel-title"
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-5 py-4">
          <MessageSquare size={16} className="shrink-0 text-text-muted" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 id="zenith-comments-panel-title" className="text-[14px] font-semibold text-text-primary">
              Comments
            </h2>
            <p className="text-[12px] text-text-muted">
              {commentCount === 0
                ? "No comments yet"
                : `${commentCount} across all tabs`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => chrome.closeCommentsPanel()}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label="Close comments panel"
          >
            <X size={16} />
          </button>
        </header>

        {commentFocus ? (
          <div className="shrink-0 border-b border-border-subtle bg-blue-50/50 px-5 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Commenting on
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-text-primary">
              {commentFocus.anchorLabel}
              <span className="font-normal text-text-muted">
                {" "}
                · {zenithCommentTabLabel(commentFocus.tab)}
              </span>
            </p>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-text-muted">
              Add a comment from any section, or use the composer below.
            </p>
          ) : (
            sorted.map((comment) => (
              <CommentListItem
                key={comment.id}
                comment={comment}
                onTogglePin={(id) => chrome.toggleCommentPin(id)}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>

        <div ref={composerRef} className="shrink-0 border-t border-border-subtle p-4">
          <ApprovalCommentInput onSubmit={handleSubmit} />
        </div>
      </aside>
    </div>,
    document.body,
  );
}
