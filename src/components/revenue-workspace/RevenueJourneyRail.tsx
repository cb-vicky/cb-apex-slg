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
}

export function RevenueJourneyRail({ activeStage, onStageChange, stageStatuses }: Props) {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto rounded-lg border border-border-default bg-surface-muted p-1">
      {stageLabels.map((stage, idx) => {
        const active = stage.id === activeStage;
        const status = stageStatuses[stage.id];
        return (
          <button
            key={stage.id}
            onClick={() => onStageChange(stage.id)}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-0.5 rounded-md px-4 py-2 text-center transition-all",
              active
                ? "bg-white shadow-sm ring-1 ring-border-default"
                : "hover:bg-white/60",
            )}
          >
            {idx > 0 && (
              <div className="absolute -left-1 top-1/2 h-px w-2 bg-border-default" />
            )}
            <span className={cn("text-[13px] font-semibold", active ? "text-text-primary" : "text-text-secondary")}>
              {stage.label}
            </span>
            {status.text && (
              <span className={cn("text-[11px]", active ? severityColor(status.severity) : "text-text-muted")}>
                {status.text}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
