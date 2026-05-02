import { X } from "lucide-react";
import { StatusBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  onApprove: () => void;
  onSubmit?: () => void;
  variant: "approve_activate" | "approve_transition" | "submit";
  className?: string;
}

export function ApprovalPanelOverlay({ open, onClose, title, onApprove, onSubmit, variant, className }: Props) {
  if (!open) return null;
  return (
    <div
      className={cn(
        "absolute inset-y-0 right-0 z-[70] flex w-[min(360px,100%)] flex-col border-l border-border-default bg-white shadow-[-8px_0_24px_rgba(0,0,0,0.08)]",
        className,
      )}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-2">
          <StatusBadge status="Pending Approval" />
          <span className="text-[12px] font-semibold text-text-primary">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
          aria-label="Close panel"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3 text-[12px] text-text-secondary">
        <p>Routing uses the same approval objects as the Approvals module. In this prototype, actions update session state only.</p>
        <ul className="list-inside list-disc text-[11px] text-text-muted">
          <li>Sarah Chen — VP Revenue (approver)</li>
          <li>Jordan Kim — Billing Ops (watcher)</li>
        </ul>
      </div>
      <div className="border-t border-border-subtle px-3 py-2">
        {variant === "submit" ? (
          <button
            type="button"
            onClick={onSubmit}
            className="w-full rounded-md bg-cb-orange px-3 py-2 text-[12px] font-semibold text-white hover:opacity-95"
          >
            Submit for approval
          </button>
        ) : (
          <button
            type="button"
            onClick={onApprove}
            className="w-full rounded-md bg-cb-orange px-3 py-2 text-[12px] font-semibold text-white hover:opacity-95"
          >
            {variant === "approve_activate" ? "Approve & activate" : "Approve transition"}
          </button>
        )}
      </div>
    </div>
  );
}
