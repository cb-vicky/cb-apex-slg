import { useEffect, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import type { TransitionDrawerIntent } from "@/data/contract-transition";
import { cn } from "@/lib/utils";

const OPTIONS: { value: TransitionDrawerIntent; label: string }[] = [
  { value: "new_deal", label: "Create New Contract" },
  { value: "amendment", label: "Amend Existing Contract" },
  { value: "early_renewal", label: "Initiate Early Renewal" },
  { value: "late_extend", label: "Extend Contract (Grace Period)" },
];

interface Props {
  value: TransitionDrawerIntent;
  onChange: (v: TransitionDrawerIntent) => void;
  /** Hide options not applicable (e.g. queue new deal only) */
  allowed?: TransitionDrawerIntent[] | "all";
  className?: string;
}

export function TransitionIntentSelector({ value, onChange, allowed = "all", className }: Props) {
  const choices = useMemo(
    () =>
      OPTIONS.filter(
        (opt) => allowed === "all" || (Array.isArray(allowed) && allowed.includes(opt.value)),
      ),
    [allowed],
  );

  useEffect(() => {
    if (choices.length === 0) return;
    if (!choices.some((c) => c.value === value)) {
      onChange(choices[0].value);
    }
  }, [choices, value, onChange]);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor="transition-intent-select"
        className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary"
      >
        What would you like to do?
      </label>
      <div className="relative">
        <select
          id="transition-intent-select"
          className={cn(
            "w-full cursor-pointer appearance-none rounded-md border border-border-default bg-white py-2 pl-2.5 pr-9 text-[13px] text-text-primary shadow-sm outline-none transition-colors",
            "hover:border-neutral-300 hover:bg-neutral-50/60",
            "focus:border-neutral-300 focus:bg-neutral-50/80 focus:ring-1 focus:ring-neutral-200/90",
            "active:border-neutral-300 active:bg-neutral-100/80",
          )}
          value={value}
          onChange={(e) => onChange(e.target.value as TransitionDrawerIntent)}
        >
          {choices.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className="pointer-events-none absolute right-2.5 top-1/2 z-[1] -translate-y-1/2 text-neutral-400"
          aria-hidden
        />
      </div>
    </div>
  );
}
