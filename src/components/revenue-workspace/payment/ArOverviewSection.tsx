import { currency } from "@/lib/utils";
import { getEmailSequenceForCustomer } from "@/data/collections-email-sequence";
import { EmailSequenceMetricTile } from "./EmailSequenceCard";

interface ArSummary {
  totalOpen: number;
  totalOverdue: number;
  overdueCount: number;
  unappliedCash: number;
  avgDaysToPay: number;
  oldestOutstandingDays: number;
}

interface Props {
  customerId: string;
  summary: ArSummary;
}

export function ArOverviewSection({ customerId, summary }: Props) {
  const emailSequence = getEmailSequenceForCustomer(customerId);

  const metricCards = [
    {
      label: "Available balance",
      value: currency(summary.unappliedCash),
      variant: summary.unappliedCash > 0 ? ("warning" as const) : ("default" as const),
    },
    {
      label: "Oldest Outstanding",
      value: summary.oldestOutstandingDays > 0 ? `${summary.oldestOutstandingDays}d` : "—",
      variant: summary.oldestOutstandingDays > 30 ? ("danger" as const) : ("default" as const),
    },
  ];

  const variantClasses = {
    default: "text-text-primary",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {metricCards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border-default bg-white px-3 py-2.5"
        >
          <p className="text-[10px] uppercase tracking-wider text-text-muted">{card.label}</p>
          <p
            className={`mt-1 text-sm font-semibold tabular-nums ${variantClasses[card.variant]}`}
          >
            {card.value}
          </p>
        </div>
      ))}
      {emailSequence ? <EmailSequenceMetricTile sequence={emailSequence} popoverAlign="right" /> : null}
    </div>
  );
}
