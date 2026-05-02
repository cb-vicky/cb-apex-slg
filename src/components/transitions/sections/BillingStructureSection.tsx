import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SectionCard } from "@/components/ui/primitives";
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

  return (
    <SectionCard title="Billing structure" className={cn(className)} bodyClassName="py-3">
      <div className="flex flex-wrap gap-4 text-[13px]">
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="billing-kind"
            checked={kind === "prepaid"}
            onChange={() => onKindChange("prepaid")}
          />
          Prepaid
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="billing-kind"
            checked={kind === "postpaid"}
            onChange={() => onKindChange("postpaid")}
          />
          Postpaid
        </label>
        <label className="inline-flex cursor-pointer items-center gap-1.5">
          <input
            type="radio"
            name="billing-kind"
            checked={kind === "hybrid"}
            onChange={() => onKindChange("hybrid")}
          />
          Hybrid (commit + usage)
        </label>
      </div>

      <LogicSummary kind={kind} />

      {(kind === "prepaid" || kind === "hybrid") && (
        <label className="mt-3 block text-[12px] font-medium text-text-primary">
          Invoice timing (commit / prepaid portion)
          <select
            className="mt-1 w-full max-w-xs rounded-md border border-border-default px-2 py-1.5 text-[12px]"
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
        className="mt-3 flex w-full items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
      >
        {detailsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        Billing logic detail
      </button>
      {detailsOpen && (
        <div className="mt-2 rounded-md border border-border-subtle bg-surface-muted/50 px-3 py-2 text-[11px] leading-relaxed text-text-secondary">
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
