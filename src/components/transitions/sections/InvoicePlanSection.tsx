import { cn } from "@/lib/utils";
import type { BillingKind } from "@/components/transitions/ingest-drawer-derive";
import { buildInvoicePlanLines } from "@/components/transitions/ingest-drawer-derive";

interface Props {
  billingKind: BillingKind;
  invoiceTiming: "on_approval" | "on_activation";
  startDate: string;
  billingFrequency: string;
  tcv: number;
  className?: string;
  /** When true, renders without an internal eyebrow heading — for use inside IngestFieldGroup. */
  hideHeading?: boolean;
}

/**
 * Flat invoice-plan rows. Designed to live inside an `IngestFieldGroup` body
 * (no own card chrome). Set `hideHeading` if the host group already announces it.
 */
export function InvoicePlanSection({
  billingKind,
  invoiceTiming,
  startDate,
  billingFrequency,
  tcv,
  className,
  hideHeading = false,
}: Props) {
  const lines = buildInvoicePlanLines({
    billingKind,
    invoiceTiming,
    startDate,
    billingFrequency,
    tcv,
  });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {hideHeading ? null : (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Invoice plan
        </p>
      )}
      <dl className="space-y-2">
        {lines.map((row) => (
          <div
            key={row.label}
            className="border-b border-border-subtle/80 pb-2 last:border-0 last:pb-0"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-text-primary">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
