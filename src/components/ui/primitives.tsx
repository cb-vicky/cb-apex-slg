import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  healthy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  enforced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  applied: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  synced: "bg-emerald-50 text-emerald-700 border-emerald-200",
  matched: "bg-emerald-50 text-emerald-700 border-emerald-200",
  posted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  updated: "bg-emerald-50 text-emerald-700 border-emerald-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  issued: "bg-emerald-50 text-emerald-700 border-emerald-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  "pending approval": "bg-amber-50 text-amber-700 border-amber-200",
  "pending review": "bg-amber-50 text-amber-700 border-amber-200",
  "pending rerun": "bg-amber-50 text-amber-700 border-amber-200",
  "review required": "bg-amber-50 text-amber-700 border-amber-200",
  "in progress": "bg-amber-50 text-amber-700 border-amber-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  "on hold": "bg-amber-50 text-amber-700 border-amber-200",
  "po required": "bg-amber-50 text-amber-700 border-amber-200",
  "medium risk": "bg-amber-50 text-amber-700 border-amber-200",
  "reminder sent": "bg-blue-50 text-blue-700 border-blue-200",
  "overdue notice": "bg-blue-50 text-blue-700 border-blue-200",
  "re-exported": "bg-blue-50 text-blue-700 border-blue-200",
  trialing: "bg-blue-50 text-blue-700 border-blue-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  extended: "bg-amber-50 text-amber-700 border-amber-200",
  "grace extended": "bg-amber-50 text-amber-700 border-amber-200",
  "awaiting activation": "bg-blue-50 text-blue-700 border-blue-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  unapplied: "bg-red-50 text-red-700 border-red-200",
  reversed: "bg-red-50 text-red-700 border-red-200",
  "no response": "bg-red-50 text-red-700 border-red-200",
  "high risk": "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  "low risk": "bg-gray-100 text-gray-500 border-gray-200",
  "no approval required": "bg-gray-50 text-gray-700 border-gray-200",
  closing: "bg-amber-50 text-amber-700 border-amber-200",
  terminated: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
  expiring: "bg-amber-50 text-amber-700 border-amber-200",
  superseded: "bg-gray-100 text-gray-500 border-gray-200",
  draft: "bg-gray-100 text-gray-600 border-gray-200",
  executed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mapping: "bg-blue-50 text-blue-700 border-blue-200",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (status.toLowerCase() === "not_required") return null;
  const key = status.toLowerCase();
  const colors = statusColors[key] ?? "bg-gray-100 text-gray-600 border-gray-200";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4", colors, className)}>
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Risk Badge
// ---------------------------------------------------------------------------
export function RiskBadge({ label }: { label: string }) {
  const lc = label.toLowerCase();
  const isHigh = lc.includes("overdue") || lc.includes("mismatch") || lc.includes("high burn");
  const isWarn = lc.includes("renewal");
  const color = isHigh
    ? "bg-red-50 text-red-700 border-red-200"
    : isWarn
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 whitespace-nowrap", color)}>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Metric Pill
// ---------------------------------------------------------------------------
export function MetricPill({ label, value, variant }: { label: string; value: string; variant?: "default" | "danger" | "warning" | "success" }) {
  const variantClasses = {
    default: "text-text-primary",
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
  };
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className={cn("text-base font-semibold tabular-nums", variantClasses[variant ?? "default"])}>{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionCard
// ---------------------------------------------------------------------------
export function SectionCard({
  title,
  children,
  className,
  actions,
  bodyClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-lg border border-border-default bg-white", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle bg-gray-50 px-5 py-3">
        <h3 className="text-[14px] font-semibold leading-tight tracking-normal text-text-primary">{title}</h3>
        {actions}
      </div>
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key–value (stacked label / value — default; optional horizontal row)
// ---------------------------------------------------------------------------
export function KV({
  label,
  value,
  className,
  layout = "stacked",
}: {
  label: string;
  value: ReactNode;
  className?: string;
  /** `inline` = label and value on one row (legacy dense rows); prefer `stacked` for detail surfaces. */
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <div className={cn("flex min-w-0 items-baseline justify-between gap-4 py-2 text-[14px]", className)}>
        <span className="shrink-0 text-text-secondary">{label}</span>
        <span className="min-w-0 truncate text-right font-medium text-text-primary">{value}</span>
      </div>
    );
  }
  return (
    <div className={cn("flex min-w-0 flex-col gap-1 py-2.5 text-left", className)}>
      <span className="text-[12px] leading-tight text-text-muted">{label}</span>
      <div className="min-w-0 truncate text-[14px] font-medium leading-snug text-text-primary">{value}</div>
    </div>
  );
}

export { DataField, DataFieldGrid } from "@/components/ui/data-field";

// ---------------------------------------------------------------------------
// Clickable record ID (quotes, contracts, invoices — alias detail routes)
// ---------------------------------------------------------------------------
export function RecordIdLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("font-medium text-blue-600 hover:text-blue-700 hover:underline", className)}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Compact Entity Chip
// ---------------------------------------------------------------------------
export function EntityChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-border-default bg-surface-muted px-2.5 py-1">
      <span className="text-[11px] uppercase tracking-wider text-text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text-primary">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Timeline Row
// ---------------------------------------------------------------------------
export function TimelineRow({ date, action, actor, detail, isLast }: { date: string; action: string; actor: string; detail?: string; isLast?: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="mt-1.5 h-2 w-2 rounded-full bg-border-default" />
        {!isLast && <div className="w-px flex-1 bg-border-default" />}
      </div>
      <div className="pb-5">
        <p className="text-[14px] font-medium leading-snug text-text-primary">{action}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-text-secondary">
          {actor} &middot; {date}
        </p>
        {detail && <p className="mt-1 text-[13px] leading-snug text-text-muted">{detail}</p>}
      </div>
    </div>
  );
}
