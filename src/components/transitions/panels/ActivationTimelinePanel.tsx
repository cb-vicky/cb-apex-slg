import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  label: string;
  detail?: string;
  done?: boolean;
}

interface Props {
  steps: Step[];
  className?: string;
}

export function ActivationTimelinePanel({ steps, className }: Props) {
  return (
    <div className={cn("rounded-lg border border-border-default bg-white", className)}>
      <div className="border-b border-border-subtle px-2.5 py-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">Activation</p>
      </div>
      <ol className="space-y-2 p-2.5">
        {steps.map((s, idx) => (
          <li key={idx} className="flex gap-2">
            {s.done ? (
              <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={2} />
            ) : (
              <Circle size={14} className="mt-0.5 shrink-0 text-border-default" strokeWidth={2} />
            )}
            <div>
              <p className="text-[11px] font-medium text-text-primary">{s.label}</p>
              {s.detail && <p className="text-[10px] text-text-muted">{s.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
