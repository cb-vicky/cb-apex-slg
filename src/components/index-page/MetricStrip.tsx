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
    <div className="flex items-stretch gap-3">
      {metrics.map((m) => (
        <div
          key={m.label}
          className="flex flex-1 flex-col gap-1 rounded-lg border border-border-default bg-surface-muted px-4 py-3"
        >
          <span className="text-[11px] uppercase tracking-wider text-text-muted">{m.label}</span>
          <span className={`text-lg font-semibold tabular-nums ${variantClasses[m.variant ?? "default"]}`}>
            {m.value}
          </span>
        </div>
      ))}
    </div>
  );
}
