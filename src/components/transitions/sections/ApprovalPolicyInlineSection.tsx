import { cn } from "@/lib/utils";

interface Props {
  futureInvoices: "always" | "if_changed" | "never";
  onChange: (v: "always" | "if_changed" | "never") => void;
  className?: string;
}

export function ApprovalPolicyInlineSection({ futureInvoices, onChange, className }: Props) {
  return (
    <section className={cn("rounded-lg border border-border-default bg-white p-3", className)}>
      <h3 className="mb-2 text-[12px] font-semibold text-text-primary">Approval policy (after approval)</h3>
      <div className="flex flex-col gap-1.5 text-[12px] text-text-primary">
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="ap" checked={futureInvoices === "always"} onChange={() => onChange("always")} />
          Approve all future invoices
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="ap" checked={futureInvoices === "if_changed"} onChange={() => onChange("if_changed")} />
          Approve if changed
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="radio" name="ap" checked={futureInvoices === "never"} onChange={() => onChange("never")} />
          Always require approval
        </label>
      </div>
    </section>
  );
}
