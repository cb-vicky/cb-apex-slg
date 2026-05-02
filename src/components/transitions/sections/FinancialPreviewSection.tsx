import type { TransitionDrawerIntent } from "@/data/contract-transition";
import type { BillingKind } from "@/components/transitions/ingest-drawer-derive";
import { firstInvoiceAmount, hybridCommitAmount } from "@/components/transitions/ingest-drawer-derive";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";
import { DrawerRailIndent } from "../DrawerSelectShell";

interface Props {
  intent: TransitionDrawerIntent;
  tcv: number;
  settlementAmount: number;
  extensionCharge: number;
  billingKind: BillingKind;
  /** `drawer` = flat queue ingest rail (no bordered card). */
  variant?: "panel" | "drawer";
  className?: string;
}

export function FinancialPreviewSection({
  intent,
  tcv,
  settlementAmount,
  extensionCharge,
  billingKind,
  variant = "panel",
  className,
}: Props) {
  const draftFirst =
    billingKind === "prepaid"
      ? firstInvoiceAmount({ billingKind: "prepaid", tcv, prepaidFirstInvoice: tcv })
      : billingKind === "hybrid"
        ? hybridCommitAmount(tcv)
        : 0;

  const drawerBody = (
    <>
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
      {intent === "amendment" && <KV label="ARR delta (illustrative)" value={currency(tcv * 0.04)} />}
      {intent === "late_extend" && (
        <>
          <KV label="Extension charges (est.)" value={currency(extensionCharge)} />
          <KV label="Final impact" value={currency(tcv + extensionCharge)} />
        </>
      )}
    </>
  );

  if (variant === "drawer") {
    return (
      <div className={cn("flex flex-col gap-1.5", className)}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Financial preview</p>
        <DrawerRailIndent>
          <div className="flex flex-col divide-y divide-border-subtle">{drawerBody}</div>
        </DrawerRailIndent>
      </div>
    );
  }

  return (
    <section className={cn("rounded-lg border border-border-default bg-white p-3", className)}>
      <h3 className="mb-2 text-[12px] font-semibold text-text-primary">Financial preview</h3>
      <dl className="space-y-1 text-[11px] text-text-secondary">
        {intent === "new_deal" && (
          <>
            <div className="flex justify-between gap-2">
              <dt>Contract value</dt>
              <dd className="font-medium text-text-primary">{currency(tcv)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>First invoice (draft)</dt>
              <dd>
                {billingKind === "postpaid"
                  ? "— (postpaid · cycle billing)"
                  : billingKind === "hybrid"
                    ? `${currency(draftFirst)} commit + usage in arrears`
                    : currency(draftFirst)}
              </dd>
            </div>
          </>
        )}
        {intent === "early_renewal" && (
          <>
            <div className="flex justify-between gap-2">
              <dt>Settlement (draft)</dt>
              <dd>{currency(settlementAmount)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>New contract value</dt>
              <dd className="font-medium text-text-primary">{currency(tcv)}</dd>
            </div>
          </>
        )}
        {intent === "amendment" && (
          <div className="flex justify-between gap-2">
            <dt>ARR delta (illustrative)</dt>
            <dd className="font-medium text-text-primary">{currency(tcv * 0.04)}</dd>
          </div>
        )}
        {intent === "late_extend" && (
          <>
            <div className="flex justify-between gap-2">
              <dt>Extension charges (est.)</dt>
              <dd>{currency(extensionCharge)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt>Final impact</dt>
              <dd className="font-medium text-text-primary">{currency(tcv + extensionCharge)}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
