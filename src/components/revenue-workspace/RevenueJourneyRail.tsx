import { cn } from "@/lib/utils";
import { severityColor, type StageStatus } from "./derive-stage-data";

export type Stage = "customer" | "quote" | "contract" | "invoicing" | "payment" | "revrec";

interface StageInfo {
  id: Stage;
  label: string;
}

const stageLabels: StageInfo[] = [
  { id: "customer", label: "Customer" },
  { id: "quote", label: "Quote" },
  { id: "contract", label: "Contract" },
  { id: "invoicing", label: "Invoicing" },
  { id: "payment", label: "Payment" },
  { id: "revrec", label: "Rev Rec" },
];

interface Props {
  activeStage: Stage;
  onStageChange: (stage: Stage) => void;
  stageStatuses: Record<Stage, StageStatus>;
  disabledStages?: Set<Stage>;
}

export function RevenueJourneyRail({ activeStage, onStageChange, stageStatuses, disabledStages }: Props) {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto rounded-lg border border-border-default bg-surface-muted p-1">
      {stageLabels.map((stage, idx) => {
        const active = stage.id === activeStage;
        const disabled = disabledStages?.has(stage.id) ?? false;
        const status = stageStatuses[stage.id];
        return (
          <button
            key={stage.id}
            type="button"
            onClick={() => !disabled && onStageChange(stage.id)}
            disabled={disabled}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-md px-4 py-2 text-center transition-all",
              active && !disabled
                ? "bg-white shadow-sm ring-1 ring-border-default"
                : disabled
                ? "cursor-not-allowed opacity-40"
                : "hover:bg-white/60",
            )}
          >
            {idx > 0 && (
              <div className="absolute -left-1 top-1/2 h-px w-2 bg-border-default" />
            )}
            <span className={cn(
              "text-[13px] font-semibold",
              active && !disabled ? "text-text-primary" : "text-text-secondary",
            )}>
              {stage.label}
            </span>
            {disabled ? (
              <span className="text-[11px] text-text-muted">Not available</span>
            ) : status.text ? (
              <span
                className={cn(
                  "text-[11px]",
                  /* Severity is meaningful even when the tab is not selected — keeps rail aligned with session + record state */
                  severityColor(status.severity),
                  active && !disabled ? "font-medium" : "opacity-90",
                )}
              >
                {status.text}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
