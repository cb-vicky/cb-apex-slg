import { cn } from "@/lib/utils";

interface Props {
  futureInvoices: "always" | "if_changed" | "never";
  onChange: (v: "always" | "if_changed" | "never") => void;
  className?: string;
}

/**
 * Flat approval-policy radio group. Designed to live inside an `IngestFieldGroup`
 * body — no own card chrome, internal eyebrow names the sub-block.
 */
export function ApprovalPolicyInlineSection({ futureInvoices, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        Approval policy (after approval)
      </p>
      <div className="flex flex-col gap-1.5 text-[13px] text-text-primary">
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="ap"
            checked={futureInvoices === "always"}
            onChange={() => onChange("always")}
          />
          Approve all future invoices
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="ap"
            checked={futureInvoices === "if_changed"}
            onChange={() => onChange("if_changed")}
          />
          Approve if changed
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="radio"
            name="ap"
            checked={futureInvoices === "never"}
            onChange={() => onChange("never")}
          />
          Always require approval
        </label>
      </div>
    </div>
  );
}
