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

// ---------------------------------------------------------------------------
// Task type pill
// ---------------------------------------------------------------------------

function TaskTypePill({ kindLabel }: { kindLabel: string }) {
  const label = kindLabel.toLowerCase();

  let style = "bg-gray-100 text-gray-700 border-gray-200";

  if (label.includes("new deal")) {
    style = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (label.includes("early renewal")) {
    style = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (label.includes("late renewal")) {
    style = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (label.includes("renewal")) {
    style = "bg-sky-50 text-sky-700 border-sky-200";
  } else if (label.includes("amendment")) {
    style = "bg-violet-50 text-violet-700 border-violet-200";
  } else if (label.includes("closure") || label.includes("closing")) {
    style = "bg-orange-50 text-orange-700 border-orange-200";
  } else if (label.includes("termination")) {
    style = "bg-red-50 text-red-700 border-red-200";
  } else if (label.includes("approval")) {
    style = "bg-purple-50 text-purple-700 border-purple-200";
  } else if (label.includes("expired")) {
    style = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (label.includes("billing")) {
    style = "bg-cyan-50 text-cyan-700 border-cyan-200";
  } else if (label.includes("enforcement")) {
    style = "bg-red-50 text-red-700 border-red-200";
  } else if (label.includes("usage")) {
    style = "bg-indigo-50 text-indigo-700 border-indigo-200";
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-[11px] font-medium leading-4",
        style,
      )}
    >
      {kindLabel}
    </span>
  );
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
    <div className="flex flex-col gap-1 rounded-2xl border border-border-default bg-white px-5 py-4">
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

/** Shared column template: task type · customer · subject · severity · detail */
const TASK_TABLE_GRID =
  "grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1.35fr)_90px_minmax(0,1.15fr)] items-center gap-3 pl-3 pr-4";

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
      <div className="flex min-w-0 items-center">
        <TaskTypePill kindLabel={task.kindLabel} />
      </div>

      <div className="min-w-0 truncate text-[14px] font-medium leading-snug text-text-primary">
        {task.customerName}
      </div>

      <div className="min-w-0 truncate text-[14px] leading-snug text-text-primary">{task.title}</div>

      <span className="flex justify-start">
        <SeverityPill severity={task.severity} />
      </span>

      <div className="min-w-0 truncate text-[13px] leading-snug text-text-muted">
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
        <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
          <div
            className={cn(
              "border-b border-border-subtle bg-white px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
              TASK_TABLE_GRID,
            )}
            aria-hidden
          >
            <span className="min-w-0 truncate">Task type</span>
            <span className="min-w-0 truncate">Customer</span>
            <span className="min-w-0 truncate">Subject</span>
            <span>Severity</span>
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
