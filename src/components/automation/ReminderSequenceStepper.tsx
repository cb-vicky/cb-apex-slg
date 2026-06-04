import { Check } from "lucide-react";
import {
  REMINDER_SEQUENCE_STEPS,
  type ReminderSequenceStepId,
} from "@/data/offline-invoice-reminders";
import { cn } from "@/lib/utils";

interface Props {
  activeStep: ReminderSequenceStepId;
  onStepChange?: (step: ReminderSequenceStepId) => void;
}

export function ReminderSequenceStepper({ activeStep, onStepChange }: Props) {
  const activeIndex = REMINDER_SEQUENCE_STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div className="flex items-center justify-center gap-0 py-1">
      {REMINDER_SEQUENCE_STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isPast = index < activeIndex;
        const isLast = index === REMINDER_SEQUENCE_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => onStepChange?.(step.id)}
              className="group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                  isActive && "bg-[#2F333D] text-white",
                  !isActive && isPast && "bg-emerald-500 text-white",
                  !isActive && !isPast && "border border-gray-300 bg-white text-text-muted",
                )}
              >
                {isPast && !isActive ? (
                  <Check size={12} strokeWidth={2.75} aria-hidden />
                ) : (
                  <span aria-hidden>{step.short}</span>
                )}
              </span>
              <span
                className={cn(
                  "text-[13px]",
                  isActive ? "font-semibold text-text-primary" : "font-medium text-text-muted",
                )}
              >
                {step.label}
              </span>
            </button>
            {!isLast ? (
              <div
                className={cn(
                  "mx-3 h-px w-16 sm:w-24",
                  index < activeIndex ? "bg-emerald-300" : "bg-gray-200",
                )}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
