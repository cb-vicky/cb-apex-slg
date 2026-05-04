import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIngestContext } from "@/context/IngestContext";
import { useDemoPersona } from "@/context/DemoPersonaContext";
import {
  deriveWorkbenchTasks,
  computeWorkbenchStats,
  sortWorkbenchTasksBySeverity,
} from "@/data/workbench-tasks";
import type { WorkbenchTask } from "@/data/workbench-tasks";
import { openDrawer } from "@/store/drawer-store";

// ---------------------------------------------------------------------------
// Severity pill
// ---------------------------------------------------------------------------

function SeverityPill({ severity }: { severity: WorkbenchTask["severity"] }) {
  const styles: Record<WorkbenchTask["severity"], string> = {
    critical: "bg-red-50 text-red-700 border-red-200",
    high: "bg-amber-50 text-amber-700 border-amber-200",
    medium: "bg-blue-50 text-blue-700 border-blue-200",
    low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  const labels: Record<WorkbenchTask["severity"], string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4",
        styles[severity],
      )}
    >
      {labels[severity]}
    </span>
  );
}

function typeLabel(type: WorkbenchTask["type"]): string {
  switch (type) {
    case "contract-ingest":
      return "Contract ingest";
    case "invoice-approval":
      return "Invoice approval";
    case "closure-approval":
      return "Closure approval";
    case "billing-task":
      return "Billing task";
    case "late-renewal-extension":
      return "Grace extension";
    case "late-renewal":
      return "Late renewal (queue)";
  }
}

function formatTcv(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Stats strip
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  warning?: boolean;
}

function StatCard({ label, value, warning }: StatCardProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-default bg-white px-5 py-4">
      <span
        className={cn(
          "text-[26px] font-semibold leading-tight tracking-tight tabular-nums",
          warning ? "text-amber-600" : "text-text-primary",
        )}
      >
        {value}
      </span>
      <span className="text-[13px] text-text-secondary">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task table — one row per task (no stacked lines in cells)
// ---------------------------------------------------------------------------

/** Shared column template: customer · subject · severity · type · detail */
const TASK_TABLE_GRID =
  "grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_90px_minmax(110px,0.95fr)_minmax(0,1.1fr)] items-center gap-3 pl-3 pr-4";

function TaskRow({
  task,
  onNavigate,
}: {
  task: WorkbenchTask;
  onNavigate: (task: WorkbenchTask) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(task)}
      className={cn(
        "group w-full border-t border-border-subtle py-3 text-left transition-colors first:border-t-0 hover:bg-surface-muted/60",
        TASK_TABLE_GRID,
      )}
    >
      <div className="min-w-0 truncate text-[13px] font-medium leading-snug text-text-primary">
        {task.customerName}
      </div>

      <div className="min-w-0 truncate text-[13px] leading-snug text-text-primary">{task.title}</div>

      <span className="flex justify-start">
        <SeverityPill severity={task.severity} />
      </span>

      <div className="min-w-0 truncate text-[12px] leading-snug text-text-secondary">{typeLabel(task.type)}</div>

      <div className="min-w-0 truncate text-[12px] leading-snug text-text-muted">
        {task.subtitle ?? "—"}
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox
        size={28}
        strokeWidth={1.5}
        className="mb-3 text-text-muted opacity-40"
      />
      <p className="text-[14px] text-text-secondary">You're all caught up.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function WorkbenchTaskList() {
  const navigate = useNavigate();
  const ctx = useIngestContext();
  const { persona } = useDemoPersona();
  const { workbenchTaskSnapshotRef } = ctx;

  const [highlightNewIds, setHighlightNewIds] = useState<Set<string>>(() => new Set());

  const tasks = deriveWorkbenchTasks(
    {
      queueItems: ctx.queueItems,
      approvalRequests: ctx.approvalRequests,
      contractClosures: ctx.contractClosures,
      pendingRenewalIngestions: ctx.pendingRenewalIngestions,
      contractGraceExtensions: ctx.contractGraceExtensions,
    },
    { persona },
  );

  const sortedIds = useMemo(() => tasks.map((t) => t.id).sort(), [tasks]);

  /** Compare current task ids to last snapshot (ref) and accumulate “new” ids until dismissed or removed from list. */
  useEffect(() => {
    const snapshot = workbenchTaskSnapshotRef.current;
    const ids = sortedIds;
    if (snapshot.length === 0 && ids.length > 0) {
      workbenchTaskSnapshotRef.current = [...ids];
      return;
    }
    const added = ids.filter((id) => !snapshot.includes(id));
    if (added.length > 0) {
      setHighlightNewIds((prev) => new Set([...prev, ...added]));
    }
    workbenchTaskSnapshotRef.current = [...ids];
  }, [sortedIds, workbenchTaskSnapshotRef]);

  const sortedTasks = useMemo(
    () => sortWorkbenchTasksBySeverity(tasks, { newTaskIds: highlightNewIds }),
    [tasks, highlightNewIds],
  );

  const stats = computeWorkbenchStats({
    queueItems: ctx.queueItems,
    approvalRequests: ctx.approvalRequests,
    contractClosures: ctx.contractClosures,
    pendingRenewalIngestions: ctx.pendingRenewalIngestions,
    contractGraceExtensions: ctx.contractGraceExtensions,
  });

  const totalTasks = tasks.length;
  const criticalCount = tasks.filter((t) => t.severity === "critical").length;

  function handleNavigate(task: WorkbenchTask) {
    setHighlightNewIds((prev) => {
      if (!prev.has(task.id)) return prev;
      const next = new Set(prev);
      next.delete(task.id);
      return next;
    });
    if (task.drawer) {
      openDrawer(task.drawer);
      return;
    }
    navigate(task.destination);
  }

  return (
    <div
      className="flex flex-col gap-7"
      data-workbench-role={persona === "approver" ? "admin" : "operator"}
      data-demo-persona={persona}
    >
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          label="Pending approvals"
          value={stats.pendingApprovalCount}
          warning={stats.pendingApprovalCount > 0}
        />
        <StatCard
          label="Queue — needs review"
          value={stats.needsReviewCount}
          warning={stats.needsReviewCount > 0}
        />
        <StatCard
          label="TCV pending action"
          value={stats.tcvPending > 0 ? formatTcv(stats.tcvPending) : "—"}
        />
        <StatCard
          label="In-flight closures"
          value={stats.inflightClosures}
          warning={stats.inflightClosures > 0}
        />
        <StatCard
          label="Grace extensions"
          value={stats.openGraceExtensions}
          warning={stats.openGraceExtensions > 0}
        />
      </div>

      {totalTasks > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-text-secondary">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            {criticalCount > 0 && (
              <span className="ml-2 font-semibold text-red-600">
                · {criticalCount} critical
              </span>
            )}
          </p>
          <span className="text-[12px] text-text-muted">
            Sorted by severity (Critical → Low)
          </span>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="border-y border-border-default bg-white">
          <div
            className={cn(
              "border-b border-border-subtle bg-gray-50 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
              TASK_TABLE_GRID,
            )}
            aria-hidden
          >
            <span className="min-w-0 truncate">Customer</span>
            <span className="min-w-0 truncate">Subject</span>
            <span>Severity</span>
            <span className="min-w-0 truncate">Type</span>
            <span className="min-w-0 truncate">Detail</span>
          </div>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function usePendingWorkbenchCounts() {
  const ctx = useIngestContext();
  const pendingApprovalCount = ctx.approvalRequests.filter(
    (r) => r.status === "Pending Approval",
  ).length;
  const inflightClosures = Object.keys(ctx.pendingRenewalIngestions).length;
  return { pendingApprovalCount, inflightClosures };
}
