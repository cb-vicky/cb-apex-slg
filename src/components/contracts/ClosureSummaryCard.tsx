import { AlertTriangle, Calendar, User, FileText, CreditCard, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import type { ContractClosure, ClosureReason } from "@/data/mock-data";
import { SectionCard, StatusBadge } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

interface Props {
  closure: ContractClosure;
  contractId: string;
  customerId: string;
}

const REASON_LABELS: Record<ClosureReason, string> = {
  customer_non_renewal: "Customer non-renewal",
  ma_consolidation: "M&A consolidation",
  mutual_agreement: "Mutual agreement",
  non_payment: "Non-payment / Collections",
  replaced_by_new: "Replaced by new contract",
  other: "Other",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function daysUntil(date: string): number {
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ClosureSummaryCard({ closure, customerId }: Props) {
  const daysRemaining = daysUntil(closure.effectiveDate);
  const isInWindDown = daysRemaining > 0;

  const settlementLabel = closure.settlementType === "termination_charge"
    ? "Termination charge"
    : closure.settlementType === "credit_note"
      ? "Credit note"
      : "No financial impact";

  return (
    <SectionCard
      title="Contract Closure"
      className={cn(
        "border-l-4",
        isInWindDown ? "border-l-amber-400" : "border-l-gray-400"
      )}
      actions={
        <StatusBadge
          status={isInWindDown ? "Closing" : closure.reason === "non_payment" ? "Terminated" : "Closed"}
        />
      }
    >
      <div className="space-y-4">
        {/* Wind-down banner */}
        {isInWindDown && (
          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <div>
              <p className="text-[13px] font-medium text-amber-800">
                Contract closing in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
              </p>
              <p className="text-[11px] text-amber-700">
                Wind-down period active until {formatDate(closure.effectiveDate)}
              </p>
            </div>
          </div>
        )}

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <div className="flex items-start gap-2">
            <Calendar size={14} className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="text-[11px] text-text-muted">Effective date</p>
              <p className="text-[13px] font-medium text-text-primary">{formatDate(closure.effectiveDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <FileText size={14} className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="text-[11px] text-text-muted">Reason</p>
              <p className="text-[13px] font-medium text-text-primary">{REASON_LABELS[closure.reason]}</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            {closure.settlementType === "credit_note" ? (
              <CreditCard size={14} className="mt-0.5 shrink-0 text-text-muted" />
            ) : (
              <DollarSign size={14} className="mt-0.5 shrink-0 text-text-muted" />
            )}
            <div>
              <p className="text-[11px] text-text-muted">Settlement</p>
              <p className="text-[13px] font-medium text-text-primary">
                {settlementLabel}
                {closure.settlementType !== "no_financial_impact" && (
                  <span className="ml-1 tabular-nums">{formatCurrency(closure.finalAmount)}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <User size={14} className="mt-0.5 shrink-0 text-text-muted" />
            <div>
              <p className="text-[11px] text-text-muted">Closed by</p>
              <p className="text-[13px] font-medium text-text-primary">{closure.closedBy}</p>
              <p className="text-[11px] text-text-muted">{formatDateTime(closure.closedAt)}</p>
            </div>
          </div>
        </div>

        {/* Reason detail */}
        {closure.reasonDetail && (
          <div className="rounded-lg border border-border-subtle bg-surface-muted px-3 py-2.5">
            <p className="text-[11px] font-medium text-text-secondary">Notes</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-text-primary">{closure.reasonDetail}</p>
          </div>
        )}

        {/* Links to credit note or invoice */}
        {(closure.creditNoteId || closure.invoiceId) && (
          <div className="flex items-center gap-3 border-t border-border-subtle pt-3">
            {closure.creditNoteId && (
              <Link
                to={`/customers/${customerId}?tab=invoicing`}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View credit note {closure.creditNoteId} →
              </Link>
            )}
            {closure.invoiceId && (
              <Link
                to={`/customers/${customerId}?tab=invoicing&invoiceId=${closure.invoiceId}`}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View termination invoice {closure.invoiceId} →
              </Link>
            )}
          </div>
        )}

        {/* Approval status */}
        {closure.approvalRequired && closure.approvalReason && (
          <div className="flex items-center gap-2 border-t border-border-subtle pt-3">
            <StatusBadge status="Pending Approval" />
            <span className="text-[11px] text-text-muted">{closure.approvalReason}</span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
