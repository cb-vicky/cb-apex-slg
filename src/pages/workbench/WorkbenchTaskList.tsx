import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIngestContext } from "@/context/IngestContext";
import {
  deriveWorkbenchTasks,
  computeWorkbenchStats,
  sortWorkbenchTasksBySeverity,
} from "@/data/workbench-tasks";
import type { WorkbenchTask } from "@/data/workbench-tasks";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkbenchTaskListProps {
  role: "admin" | "operator";
}

// ---------------------------------------------------------------------------
// Severity pill
// ---------------------------------------------------------------------------

function SeverityPill({ severity }: { severity: WorkbenchTask["severity"] }) {
  const styles: Record<WorkbenchTask["severity"], string> = {
    critical: "bg-red-50 text-red-700 border border-red-200",
    high: "bg-amber-50 text-amber-700 border border-amber-200",
    medium: "bg-blue-50 text-blue-700 border border-blue-200",
    low: "bg-gray-100 text-gray-500 border border-gray-200",
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
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none",
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
    <div className="flex flex-col gap-0.5 rounded-lg border border-border-default bg-white px-4 py-3">
      <span
        className={cn(
          "text-[22px] font-semibold leading-tight tabular-nums",
          warning ? "text-amber-600" : "text-text-primary",
        )}
      >
        {value}
      </span>
      <span className="text-[11px] text-text-secondary">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task row — single horizontal band
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  isNew,
  onNavigate,
}: {
  task: WorkbenchTask;
  isNew: boolean;
  onNavigate: (task: WorkbenchTask) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onNavigate(task)}
      className="group grid w-full grid-cols-[12px_76px_minmax(120px,0.85fr)_minmax(0,1.15fr)_minmax(88px,110px)_20px] items-center gap-x-3 gap-y-0.5 border-t border-border-default/70 px-3 py-2.5 text-left transition-colors first:border-t-0 hover:bg-surface-muted/60"
    >
      <span className="flex h-full items-start justify-center pt-1.5" aria-hidden>
        {isNew ? (
          <span
            className="h-2 w-2 shrink-0 rounded-full bg-red-500 shadow-[0_0_0_1px_rgba(255,255,255,0.9)]"
            title="New since you last viewed this list"
          />
        ) : (
          <span className="h-2 w-2 shrink-0" />
        )}
      </span>

      <SeverityPill severity={task.severity} />

      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {task.customerName}
        </p>
        <p className="truncate text-[13px] font-medium text-text-primary">{task.title}</p>
      </div>

      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-text-secondary">{typeLabel(task.type)}</p>
        {task.subtitle ? (
          <p className="truncate text-[11px] text-text-muted">{task.subtitle}</p>
        ) : (
          <p className="truncate text-[11px] text-text-muted opacity-60">—</p>
        )}
      </div>

      <div className="min-w-0 text-right">
        {task.assignee ? (
          <p className="truncate text-[11px] text-text-muted">{task.assignee}</p>
        ) : (
          <p className="text-[11px] text-text-muted">—</p>
        )}
        {task.dueDate && (
          <p className="truncate text-[11px] text-text-muted">
            Due{" "}
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <ChevronRight
        size={12}
        strokeWidth={2}
        className="shrink-0 justify-self-end text-text-muted opacity-50 transition-opacity group-hover:opacity-100"
      />
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
      <p className="text-[13px] text-text-secondary">You're all caught up.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

export function WorkbenchTaskList({ role: _role }: WorkbenchTaskListProps) {
  const navigate = useNavigate();
  const ctx = useIngestContext();
  const { workbenchTaskSnapshotRef } = ctx;

  const [highlightNewIds, setHighlightNewIds] = useState<Set<string>>(() => new Set());

  const tasks = deriveWorkbenchTasks({
    queueItems: ctx.queueItems,
    approvalRequests: ctx.approvalRequests,
    contractClosures: ctx.contractClosures,
    pendingRenewalIngestions: ctx.pendingRenewalIngestions,
  });

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
    navigate(task.destination);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-4 gap-3">
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
      </div>

      {totalTasks > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[12px] text-text-secondary">
            {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
            {criticalCount > 0 && (
              <span className="ml-2 font-semibold text-red-600">
                · {criticalCount} critical
              </span>
            )}
          </p>
          <span className="text-[11px] text-text-muted">
            Sorted by severity (Critical → Low)
          </span>
        </div>
      )}

      {sortedTasks.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border-default bg-white">
          <div
            className="grid grid-cols-[12px_76px_minmax(120px,0.85fr)_minmax(0,1.15fr)_minmax(88px,110px)_20px] items-center gap-x-3 border-b border-border-subtle bg-surface-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted"
            aria-hidden
          >
            <span />
            <span>Severity</span>
            <span>Customer / Subject</span>
            <span>Type / Detail</span>
            <span className="text-right">Source</span>
            <span />
          </div>
          {sortedTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              isNew={highlightNewIds.has(task.id)}
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
