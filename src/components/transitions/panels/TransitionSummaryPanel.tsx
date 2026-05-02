import type { ContractTransitionType } from "@/data/contract-transition";
import { currency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  type: ContractTransitionType | "late_renewal";
  tcv: number;
  customerLabel: string;
  settlementLabel?: string;
  className?: string;
}

export function TransitionSummaryPanel({
  type,
  tcv,
  customerLabel,
  settlementLabel,
  className,
}: Props) {
  const headline =
    type === "new_deal"
      ? "New contract"
      : type === "early_renewal"
        ? "Early renewal"
        : type === "amendment"
          ? "Amendment"
          : "Late renewal";

  return (
    <div className={cn("rounded-lg border border-border-default bg-white", className)}>
      <div className="border-b border-border-subtle px-2.5 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Transition</p>
      </div>
      <div className="space-y-1.5 p-2.5 text-[11px] text-text-secondary">
        <p className="font-medium text-text-primary">{headline}</p>
        <p>Customer: {customerLabel}</p>
        <p>TCV (draft): {currency(tcv)}</p>
        {settlementLabel && <p className="text-text-muted">{settlementLabel}</p>}
      </div>
    </div>
  );
}
