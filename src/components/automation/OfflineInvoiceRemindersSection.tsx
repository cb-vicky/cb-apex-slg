import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { useAutomationReminders } from "@/context/AutomationRemindersContext";
import { ReminderSequenceRow } from "@/components/automation/ReminderSequenceRow";

export function OfflineInvoiceRemindersSection() {
  const navigate = useNavigate();
  const {
    sequences,
    defaultReminder,
    upsertSequence,
    deleteSequence,
    reorderSequences,
    updateDefaultReminder,
  } = useAutomationReminders();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  function openSequence(id: string) {
    navigate(`/automation/reminders/${id}`);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      handleDragEnd();
      return;
    }
    reorderSequences(dragIndex, targetIndex);
    handleDragEnd();
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-border-default px-5 py-4">
        <div className="flex min-w-0 items-center gap-2">
          <h2 className="font-sora text-[15px] font-bold text-text-primary">
            Offline Invoice Reminders
          </h2>
          <button
            type="button"
            className="rounded-full p-0.5 text-text-muted transition-colors hover:text-text-secondary"
            aria-label="About offline invoice reminders"
          >
            <Info size={15} strokeWidth={2} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          onClick={() => navigate("/automation/reminders/new")}
          className="shrink-0 rounded-md bg-blue-600 px-3.5 py-2 font-sora text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
        >
          + Add Reminder Sequence
        </button>
      </div>

      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex items-start gap-2.5 rounded-lg border border-border-default bg-gray-50 px-4 py-3">
          <Info size={16} className="mt-0.5 shrink-0 text-text-muted" aria-hidden />
          <p className="text-[13px] leading-snug text-text-secondary">
            <span className="font-medium text-text-primary">Priority order:</span> For every invoice,
            the first matching reminder sequence will be applied
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {sequences.map((sequence, index) => (
            <ReminderSequenceRow
              key={sequence.id}
              sequence={sequence}
              priority={index + 1}
              draggable
              isDragging={dragIndex === index}
              isDropTarget={dropIndex === index && dragIndex !== index}
              onDragStart={() => setDragIndex(index)}
              onDragOver={() => setDropIndex(index)}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              onEnabledChange={(enabled) => upsertSequence({ ...sequence, enabled })}
              onEdit={() => openSequence(sequence.id)}
              onDelete={() => deleteSequence(sequence.id)}
            />
          ))}
        </div>

        <div className="border-t border-border-default pt-5">
          <div className="mb-3">
            <h3 className="text-[14px] font-semibold text-text-primary">
              Reminder for Unmatched invoice
            </h3>
            <p className="mt-1 text-[12px] text-text-muted">
              Applies to customers invoice who do not match any rules.
            </p>
          </div>
          <ReminderSequenceRow
            sequence={defaultReminder}
            variant="default"
            onEnabledChange={(enabled) => updateDefaultReminder({ enabled })}
            onEdit={() => openSequence(defaultReminder.id)}
          />
        </div>
      </div>
    </div>
  );
}
