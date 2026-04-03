import type { RoleConfig, SummaryCard as SummaryCardType } from "@/data/gettingStarted";

interface Props {
  config: RoleConfig;
}

export function SummaryStrip({ config }: Props) {
  const { summaryCards, progress } = config;
  const pct = Math.round((progress.done / progress.total) * 100);

  return (
    <div className="flex flex-col gap-3">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 rounded-full bg-surface-subtle">
          <div
            className="h-1.5 rounded-full bg-cb-orange transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[12px] font-medium tabular-nums text-text-secondary">
          {progress.done}/{progress.total}
        </span>
      </div>

      {/* Summary cards row */}
      <div className="grid grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} card={card} />
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ card }: { card: SummaryCardType }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-muted/50 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-text-muted">{card.label}</p>
      <p className="mt-1 text-[15px] font-semibold text-text-primary">{card.value}</p>
      <p className="mt-0.5 text-[12px] text-text-secondary">{card.helper}</p>
    </div>
  );
}
