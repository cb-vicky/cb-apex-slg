import { cn } from "@/lib/utils";

export interface MetricCard {
  label: string;
  value: string | number;
  variant?: "default" | "danger" | "warning" | "success";
}

const variantClasses = {
  default: "text-text-primary",
  danger: "text-red-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
};

export function MetricStrip({ metrics }: { metrics: MetricCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex flex-col gap-1 rounded-2xl border border-border-default bg-white px-5 py-4"
        >
          <span
            className={cn(
              "text-[26px] font-semibold leading-tight tracking-tight tabular-nums",
              variantClasses[m.variant ?? "default"],
            )}
          >
            {m.value}
          </span>
          <span className="text-[13px] text-text-secondary">{m.label}</span>
        </div>
      ))}
    </div>
  );
}
