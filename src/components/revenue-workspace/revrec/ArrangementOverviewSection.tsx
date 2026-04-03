import { SectionCard, KV, StatusBadge } from "@/components/ui/primitives";
import { currency, shortDate } from "@/lib/utils";
import type { RevenueArrangement } from "@/data/revrec-data";

interface Props {
  arrangement: RevenueArrangement;
}

export function ArrangementOverviewSection({ arrangement }: Props) {
  const unrec = arrangement.totalArrangementValue - arrangement.recognizedToDate;
  const blockerCount = arrangement.closeBlockers.filter((b) => !b.resolved).length;

  const cards = [
    { label: "Recognized This Period", value: currency(arrangement.schedule.at(-1)?.recognized ?? 0) },
    { label: "Recognized to Date", value: currency(arrangement.recognizedToDate) },
    { label: "Deferred Revenue", value: currency(arrangement.deferred) },
    { label: "Remaining Unrecognized", value: currency(unrec) },
    { label: "Close Blockers", value: blockerCount > 0 ? String(blockerCount) : "None", variant: blockerCount > 0 ? "danger" as const : "success" as const },
    { label: "Last Schedule Refresh", value: shortDate(arrangement.lastRecalculated) },
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
            <p className={`mt-1 text-sm font-semibold tabular-nums ${variantClasses[card.variant ?? "default"]}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Revenue Arrangement Overview">
        <div className="grid grid-cols-2 gap-x-8 gap-y-0">
          <KV label="Arrangement ID" value={arrangement.id} />
          <KV label="Source Contract" value={arrangement.contractId} />
          <KV label="Status" value={<StatusBadge status={arrangement.status} />} />
          <KV label="Accounting Policy" value={arrangement.policy} />
          <KV label="Recognition Period" value={`${shortDate(arrangement.startDate)} – ${shortDate(arrangement.endDate)}`} />
          <KV label="Total Arrangement Value" value={currency(arrangement.totalArrangementValue)} />
          <KV label="Active Obligations" value={String(arrangement.obligations.length)} />
          <KV label="Close Status" value={
            arrangement.closeBlockers.some((b) => !b.resolved && b.severity === "critical")
              ? <StatusBadge status="Blocked" />
              : arrangement.closeBlockers.some((b) => !b.resolved)
                ? <StatusBadge status="Review Required" />
                : <StatusBadge status="Ready" />
          } />
        </div>
      </SectionCard>
    </div>
  );
}
