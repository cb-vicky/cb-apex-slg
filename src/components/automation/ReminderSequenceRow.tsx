import { GripVertical, Pencil, Trash2 } from "lucide-react";
import type { OfflineReminderSequence } from "@/data/offline-invoice-reminders";
import { CompactToggleSwitch } from "@/components/automation/CompactToggleSwitch";
import { cn } from "@/lib/utils";

interface Props {
  sequence: OfflineReminderSequence;
  priority?: number;
  variant?: "rule" | "default";
  onEnabledChange: (enabled: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  draggable?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
  onDragStart?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: () => void;
  onDragEnd?: () => void;
}

export function ReminderSequenceRow({
  sequence,
  priority,
  variant = "rule",
  onEnabledChange,
  onEdit,
  onDelete,
  draggable = false,
  isDragging = false,
  isDropTarget = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: Props) {
  const isDefault = variant === "default";

  return (
    <div
      draggable={draggable}
      onDragStart={(event) => {
        if (!(event.target as HTMLElement).closest("[data-drag-handle]")) {
          event.preventDefault();
          return;
        }
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", sequence.id);
        onDragStart?.();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        onDragOver?.(event);
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.();
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-[opacity,box-shadow,border-color]",
        isDefault ? "border-border-default bg-gray-50" : "border-border-default bg-white",
        isDragging && "opacity-50",
        isDropTarget && !isDefault && "border-blue-300 ring-2 ring-blue-100",
      )}
    >
      {!isDefault ? (
        <div
          data-drag-handle
          className="shrink-0 cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing"
          aria-hidden
        >
          <GripVertical size={16} strokeWidth={2} />
        </div>
      ) : null}

      {!isDefault && priority != null ? (
        <span className="w-4 shrink-0 text-center text-[13px] font-medium tabular-nums text-text-muted">
          {priority}
        </span>
      ) : null}

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onEdit}
          className="text-left text-[14px] font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline"
        >
          {sequence.name}
        </button>
        {!isDefault && sequence.criteriaLabel ? (
          <p className="mt-0.5 text-[12px] leading-snug text-text-muted">{sequence.criteriaLabel}</p>
        ) : null}
      </div>

      <div className="shrink-0 text-right text-[12px] leading-snug text-text-muted">
        <p>First email: {sequence.firstEmailDaysBeforeDue} days before due date</p>
        <p>Last email: {sequence.lastEmailDaysAfterDue} days after due date</p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <CompactToggleSwitch
          checked={sequence.enabled}
          onChange={onEnabledChange}
          aria-label={`${sequence.enabled ? "Disable" : "Enable"} ${sequence.name}`}
        />
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
          aria-label={`Edit ${sequence.name}`}
        >
          <Pencil size={15} strokeWidth={2} aria-hidden />
        </button>
        {!isDefault ? (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${sequence.name}`}
          >
            <Trash2 size={15} strokeWidth={2} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
