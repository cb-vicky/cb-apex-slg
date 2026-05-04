import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/ui/primitives";
import { formInputClass, formLabelClass } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";
import type { BillingKind } from "@/components/transitions/ingest-drawer-derive";

interface Props {
  kind: BillingKind;
  onKindChange: (k: BillingKind) => void;
  invoiceTiming: "on_approval" | "on_activation";
  onInvoiceTimingChange: (t: "on_approval" | "on_activation") => void;
  className?: string;
}

function LogicSummary({ kind }: { kind: BillingKind }) {
  if (kind === "prepaid") {
    return (
      <ul className="mt-2 space-y-1.5 text-[12px] leading-snug text-text-primary">
        <li>
          <span className="font-semibold text-text-primary">Prepaid</span>
          <span className="text-text-muted"> — </span>
          Invoice: generated on approval path (timing below)
        </li>
        <li className="text-text-secondary">
          Activation: after invoice approval when scheduled (policy default)
        </li>
      </ul>
    );
  }
  if (kind === "postpaid") {
    return (
      <ul className="mt-2 space-y-1.5 text-[12px] leading-snug text-text-primary">
        <li>
          <span className="font-semibold text-text-primary">Postpaid</span>
          <span className="text-text-muted"> — </span>
          Invoice: end of each billing cycle (arrears)
        </li>
        <li className="text-text-secondary">Activation: immediate on contract start date</li>
      </ul>
    );
  }
  return (
    <ul className="mt-2 space-y-1.5 text-[12px] leading-snug text-text-primary">
      <li>
        <span className="font-semibold text-text-primary">Hybrid</span>
        <span className="text-text-muted"> — </span>
        Commit: upfront invoice on the path below; usage billed monthly in arrears
      </li>
      <li className="text-text-secondary">
        Activation: after invoice approval for the commit portion (usage tracks independently)
      </li>
    </ul>
  );
}

export function BillingStructureSection({
  kind,
  onKindChange,
  invoiceTiming,
  onInvoiceTimingChange,
  className,
}: Props) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  const radioClass =
    "h-4 w-4 border-border-default text-[color:var(--color-info)] focus:ring-2 focus:ring-blue-100";

  return (
    <SectionCard title="Billing structure" className={cn(className)} bodyClassName="py-3">
      <div className="flex flex-wrap gap-5 text-[14px]">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="billing-kind"
            className={radioClass}
            checked={kind === "prepaid"}
            onChange={() => onKindChange("prepaid")}
          />
          Prepaid
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="billing-kind"
            className={radioClass}
            checked={kind === "postpaid"}
            onChange={() => onKindChange("postpaid")}
          />
          Postpaid
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="billing-kind"
            className={radioClass}
            checked={kind === "hybrid"}
            onChange={() => onKindChange("hybrid")}
          />
          Hybrid (commit + usage)
        </label>
      </div>

      <LogicSummary kind={kind} />

      {(kind === "prepaid" || kind === "hybrid") && (
        <label className={cn("mt-4 flex max-w-md flex-col gap-1.5", formLabelClass)}>
          <span>Invoice timing (commit / prepaid portion)</span>
          <select
            className={cn(formInputClass, "cursor-pointer")}
            value={invoiceTiming}
            onChange={(e) =>
              onInvoiceTimingChange(e.target.value as "on_approval" | "on_activation")
            }
          >
            <option value="on_approval">On approval (immediate generation)</option>
            <option value="on_activation">On activation (held until start date)</option>
          </select>
        </label>
      )}

      <button
        type="button"
        onClick={() => setDetailsOpen((o) => !o)}
        className="mt-4 flex w-full items-center gap-1 text-left text-[12px] font-medium text-text-muted hover:text-text-secondary"
      >
        {detailsOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        Billing logic detail
      </button>
      {detailsOpen && (
        <div className="mt-2 rounded-md border border-border-subtle bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-text-secondary">
          {kind === "prepaid" && (
            <p>
              Prepaid contracts materialize a draft invoice aligned to commercial terms. When{" "}
              <strong>On activation</strong> is selected, sending to the customer is gated on
              activation scheduling and approval policy.
            </p>
          )}
          {kind === "postpaid" && (
            <p>
              Postpaid avoids an upfront invoice. Metered or seat-based charges roll into cycle
              invoices; provisioning can proceed without a paid invoice.
            </p>
          )}
          {kind === "hybrid" && (
            <p>
              Hybrid separates <strong>committed spend</strong> (invoiced like prepaid) from{" "}
              <strong>variable usage</strong> (invoiced in arrears). Financial preview and invoice
              plan update automatically.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
