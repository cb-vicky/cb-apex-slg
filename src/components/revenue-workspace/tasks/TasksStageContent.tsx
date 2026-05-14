import { useState, useMemo } from "react";
import {
  Check,
  Clock,
  MoreHorizontal,
  AlertCircle,
  ArrowUpCircle,
  ArrowRightCircle,
  ArrowDownCircle,
  Circle,
  ExternalLink,
  User,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Customer } from "@/data/mock-data";
import {
  getTasksForCustomer,
  PRIORITY_ORDER,
  PRIORITY_LABELS,
  STATUS_LABELS,
  TYPE_LABELS,
  type CustomerTask,
  type TaskPriority,
  type TaskStatus,
} from "@/data/customer-tasks";

interface Props {
  customer: Customer;
  onTaskClick?: (task: CustomerTask) => void;
}

export function TasksStageContent({ customer, onTaskClick }: Props) {
  const allTasks = useMemo(() => getTasksForCustomer(customer.id), [customer.id]);
  const [tasks, setTasks] = useState<CustomerTask[]>(allTasks);
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    if (filter === "open") {
      filtered = tasks.filter((t) => t.status !== "done");
    } else if (filter === "done") {
      filtered = tasks.filter((t) => t.status === "done");
    }
    return filtered.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }, [tasks, filter]);

  const openCount = tasks.filter((t) => t.status !== "done").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  function updateTask(taskId: string, updates: Partial<CustomerTask>) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  }

  function handleMarkDone(task: CustomerTask) {
    updateTask(task.id, { status: "done" });
  }

  function handleSnooze(task: CustomerTask, days: number) {
    const snoozedUntil = new Date();
    snoozedUntil.setDate(snoozedUntil.getDate() + days);
    updateTask(task.id, {
      status: "snoozed",
      snoozedUntil: snoozedUntil.toISOString().split("T")[0],
    });
  }

  function handleChangePriority(task: CustomerTask, priority: TaskPriority) {
    updateTask(task.id, { priority });
  }

  function handleChangeAssignee(task: CustomerTask, assignee: string) {
    updateTask(task.id, { assignee });
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-sora text-[20px] font-semibold text-text-primary">Tasks</h2>
          <p className="mt-1 text-[13px] text-text-muted">
            {openCount} open · {doneCount} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterPill
            label="All"
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterPill
            label="Open"
            count={openCount}
            active={filter === "open"}
            onClick={() => setFilter("open")}
          />
          <FilterPill
            label="Done"
            count={doneCount}
            active={filter === "done"}
            onClick={() => setFilter("done")}
          />
        </div>
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-[20px] border border-border-default bg-white p-12 text-center shadow-sm">
          <p className="text-[14px] text-text-muted">No tasks found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-[20px] border border-border-default bg-white shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default bg-gray-50/80">
                <th className="w-10 px-3 py-3" />
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Task
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Related to
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Priority
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Assignee
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Due
                </th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onMarkDone={() => handleMarkDone(task)}
                  onSnooze={(days) => handleSnooze(task, days)}
                  onChangePriority={(p) => handleChangePriority(task, p)}
                  onChangeAssignee={(a) => handleChangeAssignee(task, a)}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Row
// ---------------------------------------------------------------------------

function TaskRow({
  task,
  onMarkDone,
  onSnooze,
  onChangePriority,
  onChangeAssignee,
  onClick,
}: {
  task: CustomerTask;
  onMarkDone: () => void;
  onSnooze: (days: number) => void;
  onChangePriority: (priority: TaskPriority) => void;
  onChangeAssignee: (assignee: string) => void;
  onClick?: () => void;
}) {
  const [showActions, setShowActions] = useState(false);
  const isDone = task.status === "done";
  const isOverdue = !isDone && new Date(task.dueDate) < new Date();

  return (
    <tr
      className={cn(
        "group border-b border-border-default transition-colors last:border-b-0",
        isDone ? "bg-gray-50/50" : "hover:bg-gray-50/50",
      )}
    >
      {/* Checkbox */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onMarkDone}
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
            isDone
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-gray-300 hover:border-gray-400",
          )}
        >
          {isDone && <Check size={12} strokeWidth={3} />}
        </button>
      </td>

      {/* Task */}
      <td className="px-3 py-3">
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "text-left transition-colors",
            isDone ? "text-text-muted line-through" : "text-text-primary hover:text-blue-600",
          )}
        >
          <p className="text-[14px] font-medium">{task.title}</p>
          <p className="mt-0.5 text-[12px] text-text-muted">
            {TYPE_LABELS[task.type]}
          </p>
        </button>
      </td>

      {/* Related to */}
      <td className="px-3 py-3">
        {task.relatedTo ? (
          <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 text-[13px] text-blue-600 transition-colors hover:text-blue-700"
          >
            <span>{task.relatedTo.label}</span>
            <ExternalLink size={12} />
          </button>
        ) : (
          <span className="text-[13px] text-text-muted">—</span>
        )}
      </td>

      {/* Priority */}
      <td className="px-3 py-3">
        <PriorityDropdown
          value={task.priority}
          onChange={onChangePriority}
          disabled={isDone}
        />
      </td>

      {/* Assignee */}
      <td className="px-3 py-3">
        <AssigneeDropdown
          value={task.assignee}
          onChange={onChangeAssignee}
          disabled={isDone}
        />
      </td>

      {/* Due */}
      <td className="px-3 py-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[13px]",
            isOverdue ? "font-medium text-red-600" : "text-text-secondary",
          )}
        >
          <Calendar size={12} />
          {formatDate(task.dueDate)}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={task.status} snoozedUntil={task.snoozedUntil} />
      </td>

      {/* Actions */}
      <td className="px-3 py-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowActions(!showActions)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
          >
            <MoreHorizontal size={16} />
          </button>
          {showActions && (
            <ActionsDropdown
              onSnooze={onSnooze}
              onClose={() => setShowActions(false)}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Priority Dropdown
// ---------------------------------------------------------------------------

const PRIORITY_CONFIG: Record<TaskPriority, { icon: typeof AlertCircle; color: string }> = {
  critical: { icon: AlertCircle, color: "text-red-600" },
  high: { icon: ArrowUpCircle, color: "text-orange-500" },
  medium: { icon: ArrowRightCircle, color: "text-amber-500" },
  low: { icon: ArrowDownCircle, color: "text-gray-400" },
};

function PriorityDropdown({
  value,
  onChange,
  disabled,
}: {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const config = PRIORITY_CONFIG[value];
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] transition-colors",
          disabled ? "cursor-default opacity-50" : "hover:bg-gray-100",
          config.color,
        )}
      >
        <Icon size={14} />
        {PRIORITY_LABELS[value]}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-32 rounded-md border border-border-default bg-white py-1 shadow-lg">
          {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const PIcon = cfg.icon;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-gray-50",
                  cfg.color,
                )}
              >
                <PIcon size={14} />
                {PRIORITY_LABELS[p]}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Assignee Dropdown
// ---------------------------------------------------------------------------

const ASSIGNEES = ["Alex Nguyen", "Jordan Kim", "Priya Mehta", "Lena Schulz"];

function AssigneeDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (assignee: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-text-secondary transition-colors",
          disabled ? "cursor-default opacity-50" : "hover:bg-gray-100",
        )}
      >
        <User size={12} />
        {value}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-10 mt-1 w-40 rounded-md border border-border-default bg-white py-1 shadow-lg">
          {ASSIGNEES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => {
                onChange(a);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-gray-50",
                a === value ? "bg-gray-50 font-medium" : "",
              )}
            >
              <User size={12} />
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

function StatusBadge({ status, snoozedUntil }: { status: TaskStatus; snoozedUntil?: string }) {
  const configs: Record<TaskStatus, { bg: string; text: string; icon: typeof Circle }> = {
    open: { bg: "bg-blue-50", text: "text-blue-700", icon: Circle },
    in_progress: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
    snoozed: { bg: "bg-gray-100", text: "text-gray-600", icon: Clock },
    done: { bg: "bg-emerald-50", text: "text-emerald-700", icon: Check },
  };

  const config = configs[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-medium",
        config.bg,
        config.text,
      )}
    >
      <Icon size={12} />
      {STATUS_LABELS[status]}
      {status === "snoozed" && snoozedUntil && (
        <span className="text-[11px] opacity-70">until {formatDate(snoozedUntil)}</span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Actions Dropdown
// ---------------------------------------------------------------------------

function ActionsDropdown({
  onSnooze,
  onClose,
}: {
  onSnooze: (days: number) => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-10" onClick={onClose} />
      <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-border-default bg-white py-1 shadow-lg">
        <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          Snooze for
        </p>
        {[
          { label: "1 day", days: 1 },
          { label: "3 days", days: 3 },
          { label: "1 week", days: 7 },
          { label: "2 weeks", days: 14 },
        ].map(({ label, days }) => (
          <button
            key={days}
            type="button"
            onClick={() => {
              onSnooze(days);
              onClose();
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-text-secondary transition-colors hover:bg-gray-50"
          >
            <Clock size={12} />
            {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Filter Pill
// ---------------------------------------------------------------------------

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-100 text-text-secondary hover:bg-gray-200",
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[11px]",
            active ? "bg-white/20" : "bg-gray-200",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
