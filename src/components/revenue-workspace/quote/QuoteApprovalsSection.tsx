import type { ApprovalInfo } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { AlertTriangle, Clock, MessageSquare, User } from "lucide-react";

export function QuoteApprovalsSection({ approval }: { approval: ApprovalInfo }) {
  return (
    <SectionCard
      title="Approvals & Policy Checks"
      className="border-amber-200 bg-amber-50/30"
    >
      <div className="flex flex-col gap-3">
        {/* Status row */}
        <div className="flex items-center gap-4">
          <StatusBadge status={approval.status === "pending" ? "Pending Approval" : approval.status} />
          <span className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary">
            <User size={13} />
            <span className="font-medium text-text-primary">{approval.currentApprover}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[13px] text-amber-600">
            <Clock size={13} />
            Pending since {approval.pendingSince}
          </span>
        </div>

        {/* Triggered rules */}
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

        {/* Comments */}
        {approval.comments && (
          <div className="flex items-start gap-2 rounded-md border border-border-default bg-white px-3 py-2 text-[13px] text-text-secondary">
            <MessageSquare size={13} className="mt-0.5 shrink-0 text-text-muted" />
            {approval.comments}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
