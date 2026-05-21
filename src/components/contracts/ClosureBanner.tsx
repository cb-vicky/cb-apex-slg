import { AlertTriangle, Clock } from "lucide-react";
import type { ContractClosure, ClosureReason } from "@/data/mock-data";

interface Props {
  closure: ContractClosure;
}

const REASON_LABELS: Record<ClosureReason, string> = {
  customer_non_renewal: "Customer non-renewal",
  ma_consolidation: "M&A consolidation",
  mutual_agreement: "Mutual agreement",
  non_payment: "Non-payment / Collections",
  replaced_by_new: "Replaced by new contract",
  other: "Other",
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function daysUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ClosureBanner({ closure }: Props) {
  const daysRemaining = daysUntil(closure.effectiveDate);
  
  if (daysRemaining <= 0) return null;

  const settlementLabel = closure.settlementType === "termination_charge"
    ? `Termination charge: ${formatCurrency(closure.finalAmount)}`
    : closure.settlementType === "credit_note"
      ? `Credit note: ${formatCurrency(closure.finalAmount)}`
      : "No financial impact";

  return (
    <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-gradient-to-r from-amber-50 to-amber-50/50 px-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
        <AlertTriangle size={16} className="text-amber-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-sora text-[14px] font-bold text-amber-900">
            Contract closing on {formatDate(closure.effectiveDate)}
          </h3>
          <span className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[12px] font-medium leading-4 text-amber-700">
            <Clock size={12} />
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
          </span>
        </div>
        <p className="mt-1 text-[12px] text-amber-800">
          <span className="font-medium">Reason:</span> {REASON_LABELS[closure.reason]}
          {closure.reasonDetail && <span className="text-amber-700"> — {closure.reasonDetail.slice(0, 100)}{closure.reasonDetail.length > 100 ? "..." : ""}</span>}
        </p>
        <p className="mt-0.5 text-[12px] text-amber-700">
          <span className="font-medium">Settlement:</span> {settlementLabel}
          {" · "}
          <span className="font-medium">Closed by:</span> {closure.closedBy}
        </p>
      </div>
    </div>
  );
}
