import type { TransitionDrawerIntent } from "@/data/contract-transition";
import type { BillingKind } from "@/components/transitions/ingest-drawer-derive";
import { firstInvoiceAmount, hybridCommitAmount } from "@/components/transitions/ingest-drawer-derive";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";

interface Props {
  intent: TransitionDrawerIntent;
  tcv: number;
  settlementAmount: number;
  extensionCharge: number;
  billingKind: BillingKind;
  className?: string;
  /** When true, suppresses the inner eyebrow heading — use when host group title already conveys it. */
  hideHeading?: boolean;
}

/**
 * Flat financial preview rows. Designed to live inside an `IngestFieldGroup`
 * body — by default it renders an inner eyebrow ("Financial preview") because
 * it is usually a sub-block of a broader Billing & invoicing group.
 */
export function FinancialPreviewSection({
  intent,
  tcv,
  settlementAmount,
  extensionCharge,
  billingKind,
  className,
  hideHeading = false,
}: Props) {
  const draftFirst =
    billingKind === "prepaid"
      ? firstInvoiceAmount({ billingKind: "prepaid", tcv, prepaidFirstInvoice: tcv })
      : billingKind === "hybrid"
        ? hybridCommitAmount(tcv)
        : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {hideHeading ? null : (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Financial preview
        </p>
      )}
      <div className="flex flex-col divide-y divide-border-subtle">
        {intent === "new_deal" && (
          <>
            <KV label="Contract value" value={currency(tcv)} />
            <KV
              label="First invoice (draft)"
              value={
                billingKind === "postpaid"
                  ? "— (postpaid · cycle billing)"
                  : billingKind === "hybrid"
                    ? `${currency(draftFirst)} commit + usage in arrears`
                    : currency(draftFirst)
              }
            />
          </>
        )}
        {intent === "early_renewal" && (
          <>
            <KV label="Settlement (draft)" value={currency(settlementAmount)} />
            <KV label="New contract value" value={currency(tcv)} />
          </>
        )}
        {intent === "amendment" && (
          <KV label="ARR delta (illustrative)" value={currency(tcv * 0.04)} />
        )}
        {intent === "late_extend" && (
          <>
            <KV label="Extension charges (est.)" value={currency(extensionCharge)} />
            <KV label="Final impact" value={currency(tcv + extensionCharge)} />
          </>
        )}
      </div>
    </div>
  );
}
