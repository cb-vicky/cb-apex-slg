import { useState } from "react";
import type { ApprovalInfo, QuoteComment } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { cn, shortDate } from "@/lib/utils";

function badgeLabelForApproval(status: ApprovalInfo["status"]): string {
  switch (status) {
    case "pending":
      return "Pending Approval";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "not_required":
      return "No approval required";
    default:
      return "Unknown";
  }
}

function approverSummary(approval: ApprovalInfo): string {
  switch (approval.status) {
    case "not_required":
      return "Within policy thresholds — no approval routing.";
    case "pending": {
      const who = approval.currentApprover || "—";
      const since = approval.pendingSince ? ` · Pending since ${shortDate(approval.pendingSince)}` : "";
      return `${who}${since}`;
    }
    case "approved":
      return approval.currentApprover ? `Approved by ${approval.currentApprover}` : "Approved";
    case "rejected":
      return approval.currentApprover ? `Rejected by ${approval.currentApprover}` : "Rejected";
    default:
      return "";
  }
}

function WhyThisTriggered({
  rules,
  popoverAlign = "left",
}: {
  rules: string[];
  popoverAlign?: "left" | "right";
}) {
  if (rules.length === 0) return null;
  return (
    <div className="group relative inline-flex max-w-full">
      <button
        type="button"
        className="border-b border-dotted border-text-secondary text-left text-[13px] font-medium text-text-secondary underline-offset-2 transition-colors hover:border-text-primary hover:text-text-primary"
      >
        Why
      </button>
      <div
        className={cn(
          "pointer-events-none invisible absolute top-full z-50 w-[min(22rem,calc(100vw-3rem))] pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          popoverAlign === "right" ? "right-0 left-auto" : "left-0",
        )}
        role="tooltip"
      >
        <div className="rounded-md border border-border-default bg-white p-3 shadow-md">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Triggered rules</p>
          <ul className="mt-2 space-y-1.5">
            {rules.map((rule) => (
              <li key={rule} className="text-[12px] leading-snug text-text-primary">
                {rule}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function QuoteApprovalsSection({
  approval,
  comments,
  teamCommentsUnread = 0,
}: {
  approval: ApprovalInfo;
  comments: QuoteComment[];
  teamCommentsUnread?: number;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const hasThread = comments.length > 0;
  const unread = teamCommentsUnread;

  return (
    <SectionCard title="Approvals & Policy Checks">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge status={badgeLabelForApproval(approval.status)} />
            <p className="min-w-0 text-[13px] leading-snug text-text-primary">{approverSummary(approval)}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-3 gap-y-1">
            {approval.triggeredRules.length > 0 ? (
              <WhyThisTriggered rules={approval.triggeredRules} popoverAlign="right" />
            ) : null}

            {hasThread ? (
              <button
                type="button"
                onClick={() => setCommentsOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
              >
                {commentsOpen ? (
                  <span>Hide comments</span>
                ) : unread > 0 ? (
                  <>
                    <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-blue-600" aria-hidden />
                    <span>
                      Show comments ({unread} new)
                    </span>
                  </>
                ) : (
                  <span>Show comments ({comments.length})</span>
                )}
              </button>
            ) : null}
          </div>
        </div>

        {hasThread && commentsOpen && (
          <ul className="space-y-3 border-t border-border-subtle pt-3">
            {comments.map((comment) => (
              <li key={comment.id} className="text-[13px]">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-text-primary">{comment.author}</span>
                  <span className="text-[11px] text-text-muted">{shortDate(comment.date)}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-muted">{comment.role}</p>
                <p className="mt-1.5 leading-relaxed text-text-secondary">{comment.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}
