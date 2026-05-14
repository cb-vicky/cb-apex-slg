import { cn } from "@/lib/utils";
import type { Milestone, MilestoneStatus } from "@/data/gettingStarted";
import { CheckCircle2 } from "lucide-react";

const statusStyles: Record<MilestoneStatus, string> = {
  Complete: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "In progress": "bg-amber-50 text-amber-700 border-amber-200",
  "Not started": "bg-gray-100 text-gray-500 border-gray-200",
  Blocked: "bg-red-50 text-red-600 border-red-200",
};

interface Props {
  milestone: Milestone;
}

export function MilestoneCard({ milestone }: Props) {
  const Icon = milestone.icon;
  const isComplete = milestone.status === "Complete";

  return (
    <div className={cn(
      "flex min-h-[190px] flex-col rounded-2xl border bg-white p-5 transition-shadow hover:shadow-md",
      isComplete ? "border-emerald-200/60" : "border-border-default"
    )}>
      {/* Top row: eyebrow + status */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          {milestone.eyebrow}
        </span>
        <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4", statusStyles[milestone.status])}>
          {milestone.status}
        </span>
      </div>

      {/* Icon + title */}
      <div className="mt-3 flex items-start gap-3">
        <div className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isComplete ? "bg-emerald-50" : "bg-surface-muted"
        )}>
          {isComplete ? (
            <CheckCircle2 size={16} className="text-emerald-500" />
          ) : (
            <Icon size={16} className="text-text-secondary" />
          )}
        </div>
        <h3 className="font-sora text-[14px] font-semibold leading-snug text-text-primary">
          {milestone.title}
        </h3>
      </div>

      {/* Description */}
      <p className="mt-2 flex-1 text-[13px] leading-relaxed text-text-secondary">
        {milestone.description}
      </p>

      {/* Complete when */}
      <p className="mt-3 text-[11px] text-text-muted">
        <span className="font-medium">Complete when:</span> {milestone.completeWhen}
      </p>

      {/* CTA */}
      <button className={cn(
        "mt-3 self-start rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-colors",
        isComplete
          ? "border border-border-default text-text-secondary hover:bg-surface-muted"
          : "bg-cb-orange text-white hover:bg-[#e5582e]"
      )}>
        {milestone.cta}
      </button>
    </div>
  );
}
