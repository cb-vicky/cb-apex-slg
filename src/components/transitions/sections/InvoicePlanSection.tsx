import { SectionCard } from "@/components/ui/primitives";
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
}

export function InvoicePlanSection({
  billingKind,
  invoiceTiming,
  startDate,
  billingFrequency,
  tcv,
  className,
}: Props) {
  const lines = buildInvoicePlanLines({
    billingKind,
    invoiceTiming,
    startDate,
    billingFrequency,
    tcv,
  });

  return (
    <SectionCard title="Invoice plan" className={cn(className)} bodyClassName="py-3">
      <dl className="space-y-2">
        {lines.map((row) => (
          <div key={row.label} className="border-b border-border-subtle/80 pb-2 last:border-0 last:pb-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-[13px] leading-snug text-text-primary">{row.detail}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
