import type { ReactNode } from "react";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { KV } from "@/components/ui/primitives";

interface Props {
  tcv: number;
  startDate: string;
  className?: string;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <span className="text-[11px] font-medium leading-tight text-text-muted">{label}</span>
      <div className="text-[13px] font-semibold leading-snug text-text-primary">{children}</div>
    </div>
  );
}

/** Read-only draft amounts + invoice plan (flat layout for ingest drawer rail). */
export function ContractProcessingSummarySection({ tcv, startDate, className }: Props) {
  const invDetail = `${currency(tcv)} — held until activation (${startDate}).`;

  return (
    <div className={cn("flex flex-col divide-y divide-border-subtle", className)}>
      <KV label="Contract value (draft)" value={currency(tcv)} />
      <KV label="First invoice (draft)" value={currency(tcv)} />
      <SummaryRow label="Invoice #1">{invDetail}</SummaryRow>
      <SummaryRow label="Installments">None (single upfront invoice for this term).</SummaryRow>
    </div>
  );
}
