import { useState } from "react";
import type { ApprovalInfo, QuoteComment } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, User, XCircle } from "lucide-react";
import { shortDate } from "@/lib/utils";

function sectionStyle(status: ApprovalInfo["status"]) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50/30";
    case "approved":
      return "border-emerald-200 bg-emerald-50/30";
    case "rejected":
      return "border-rose-200 bg-rose-50/30";
    default:
      return "border-border-default bg-white";
  }
}

function ApproverRow({ approval }: { approval: ApprovalInfo }) {
  const { status, currentApprover, pendingSince } = approval;

  if (status === "not_required") {
    return (
      <div className="flex items-center gap-2 text-[13px] text-text-secondary">
        <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
        No approval required — quote is within policy thresholds.
      </div>
    );
  }

  const approverLabel =
    status === "approved"
      ? currentApprover
        ? `Approved by ${currentApprover}`
        : "Auto-approved"
      : status === "rejected"
      ? currentApprover
        ? `Rejected by ${currentApprover}`
        : "Rejected"
      : currentApprover;

  const approverIcon =
    status === "approved" ? (
      <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
    ) : status === "rejected" ? (
      <XCircle size={13} className="shrink-0 text-rose-500" />
    ) : (
      <User size={13} className="shrink-0 text-text-muted" />
    );

  return (
    <div className="flex items-center gap-4">
      <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
        {approverIcon}
        <span className="font-medium text-text-primary">{approverLabel}</span>
      </span>
      {status === "pending" && pendingSince && (
        <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-600">
          <Clock size={13} />
          Pending since {shortDate(pendingSince)}
        </span>
      )}
    </div>
  );
}

export function QuoteApprovalsSection({
  approval,
  comments,
}: {
  approval: ApprovalInfo;
  comments: QuoteComment[];
}) {
  const [showAllComments, setShowAllComments] = useState(false);
  const visibleComments = showAllComments ? comments : comments.slice(0, 1);

  return (
    <SectionCard
      title="Approvals & Policy Checks"
      className={sectionStyle(approval.status)}
    >
      <div className="flex flex-col gap-3">
        {/* Status + approver row */}
        <div className="flex items-center gap-4">
          <StatusBadge status={approval.status === "pending" ? "Pending Approval" : approval.status} />
          <ApproverRow approval={approval} />
        </div>

        {/* Triggered rules — only if there are any */}
        {approval.triggeredRules.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-text-muted">Triggered Rules</span>
            <div className="flex flex-col gap-1">
              {approval.triggeredRules.map((rule) => (
                <div key={rule} className="flex items-start gap-2 text-[13px] text-text-primary">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                  {rule}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        {visibleComments.length > 0 ? (
          <div className="rounded-md border border-border-default bg-white px-3 py-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-text-muted">
                <MessageSquare size={12} />
                Team comments
              </span>
              {comments.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllComments((prev) => !prev)}
                  className="text-[11px] font-medium text-cb-orange hover:text-cb-orange/80"
                >
                  {showAllComments ? "Show latest" : `View all ${comments.length} comments`}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {visibleComments.map((comment, index) => (
                <div key={comment.id} className="relative pl-4">
                  {showAllComments && index < visibleComments.length - 1 && (
                    <span className="absolute left-[5px] top-4 h-[calc(100%+8px)] w-px bg-border-subtle" />
                  )}
                  <span className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-cb-orange/70" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[12px]">
                      <span className="font-medium text-text-primary">{comment.author}</span>
                      <span className="ml-1 text-text-secondary">({comment.role})</span>
                    </div>
                    <span className="shrink-0 text-[11px] text-text-muted">{shortDate(comment.date)}</span>
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{comment.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : approval.comments ? (
          <div className="flex items-start gap-2 rounded-md border border-border-default bg-white px-3 py-2 text-[13px] text-text-secondary">
            <MessageSquare size={13} className="mt-0.5 shrink-0 text-text-muted" />
            {approval.comments}
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
