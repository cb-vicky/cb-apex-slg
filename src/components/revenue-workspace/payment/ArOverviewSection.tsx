import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { currency } from "@/lib/utils";
import type { CollectionCase } from "@/data/billing-data";

interface ArSummary {
  totalOpen: number;
  totalOverdue: number;
  overdueCount: number;
  unappliedCash: number;
  avgDaysToPay: number;
  oldestOutstandingDays: number;
}

interface Props {
  summary: ArSummary;
  primaryCase?: CollectionCase;
}

export function ArOverviewSection({ summary, primaryCase }: Props) {
  const cards = [
    { label: "Total Open", value: currency(summary.totalOpen), variant: summary.totalOpen > 0 ? "warning" as const : "default" as const },
    { label: "Overdue", value: currency(summary.totalOverdue), variant: summary.totalOverdue > 0 ? "danger" as const : "default" as const },
    { label: "Unapplied Cash", value: currency(summary.unappliedCash), variant: summary.unappliedCash > 0 ? "warning" as const : "default" as const },
    { label: "Avg Days to Pay", value: `${summary.avgDaysToPay}d`, variant: summary.avgDaysToPay > 30 ? "warning" as const : "default" as const },
    { label: "Overdue Invoices", value: String(summary.overdueCount), variant: summary.overdueCount > 0 ? "danger" as const : "default" as const },
    { label: "Oldest Outstanding", value: summary.oldestOutstandingDays > 0 ? `${summary.oldestOutstandingDays}d` : "—", variant: summary.oldestOutstandingDays > 30 ? "danger" as const : "default" as const },
  ];

  const variantClasses = {
    default: "text-text-primary",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-border-default bg-white px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
            <p className={`mt-1 text-sm font-semibold tabular-nums ${variantClasses[card.variant]}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="AR Overview">
        <div className="grid grid-cols-2 gap-x-8 gap-y-0">
          <KV label="Total Outstanding" value={currency(summary.totalOpen)} />
          <KV label="Overdue Amount" value={<span className={summary.totalOverdue > 0 ? "text-red-600" : ""}>{currency(summary.totalOverdue)}</span>} />
          <KV label="Payment Behavior" value={summary.avgDaysToPay <= 30 ? "On-time" : `Avg ${summary.avgDaysToPay}d late`} />
          <KV label="Risk Level" value={
            summary.totalOverdue > 20000 ? <StatusBadge status="High Risk" /> :
            summary.totalOverdue > 0 ? <StatusBadge status="Medium Risk" /> :
            <StatusBadge status="Low Risk" />
          } />
          {primaryCase && (
            <>
              <KV label="Collection Owner" value={primaryCase.owner} />
              <KV label="Current Stage" value={<StatusBadge status={primaryCase.stage} />} />
              {primaryCase.ptpDate && <KV label="Promise to Pay" value={primaryCase.ptpDate} />}
              <KV label="Next Step" value={primaryCase.nextStep} />
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
