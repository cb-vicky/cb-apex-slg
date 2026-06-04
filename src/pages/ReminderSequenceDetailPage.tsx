import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2,
} from "lucide-react";
import { useScrolled } from "@/hooks/useScrolled";
import { useAutomationReminders } from "@/context/AutomationRemindersContext";
import { ReminderConditionsBuilder } from "@/components/automation/ReminderConditionsBuilder";
import { ReminderEmailActionsSection } from "@/components/automation/ReminderEmailActionsSection";
import { ReminderSequenceStepper } from "@/components/automation/ReminderSequenceStepper";
import { CompactToggleSwitch } from "@/components/automation/CompactToggleSwitch";
import {
  REMINDER_SEQUENCE_STEPS,
  createDefaultDueDateEmail,
  createNewReminderSequence,
  type OfflineReminderSequence,
  type ReminderSequenceStepId,
} from "@/data/offline-invoice-reminders";
import { cn } from "@/lib/utils";

export function ReminderSequenceDetailPage() {
  const { sequenceId } = useParams<{ sequenceId: string }>();
  const navigate = useNavigate();
  const { getSequence, upsertSequence, deleteSequence } = useAutomationReminders();
  const { ref: scrollRef, isScrolled } = useScrolled();

  const isNew = sequenceId === "new";
  const existing = !isNew && sequenceId ? getSequence(sequenceId) : undefined;

  const [draft, setDraft] = useState<OfflineReminderSequence>(() => {
    const base = existing ?? createNewReminderSequence();
    return {
      ...base,
      emails: base.emails?.length ? base.emails : [createDefaultDueDateEmail()],
    };
  });
  const [activeStep, setActiveStep] = useState<ReminderSequenceStepId>("segment");
  const [editingTitle, setEditingTitle] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState("Last saved just now");

  useEffect(() => {
    if (existing) {
      setDraft({
        ...existing,
        emails: existing.emails?.length ? existing.emails : [createDefaultDueDateEmail()],
      });
    }
  }, [existing]);

  const stepIndex = REMINDER_SEQUENCE_STEPS.findIndex((s) => s.id === activeStep);
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === REMINDER_SEQUENCE_STEPS.length - 1;

  const breadcrumbLabel = useMemo(
    () => (isNew ? "New Reminder Sequence" : draft.name),
    [draft.name, isNew],
  );

  function persistDraft(next: OfflineReminderSequence) {
    setDraft(next);
    upsertSequence(next);
    setLastSavedLabel("Last saved just now");
  }

  function patchDraft(patch: Partial<OfflineReminderSequence>) {
    persistDraft({ ...draft, ...patch });
  }

  function handleClose() {
    upsertSequence(draft);
    navigate("/automation");
  }

  function handleDelete() {
    if (!isNew && draft.id) deleteSequence(draft.id);
    navigate("/automation");
  }

  function goPrevious() {
    if (isFirstStep) return;
    setActiveStep(REMINDER_SEQUENCE_STEPS[stepIndex - 1].id);
  }

  function goNext() {
    if (isLastStep) {
      handleClose();
      return;
    }
    setActiveStep(REMINDER_SEQUENCE_STEPS[stepIndex + 1].id);
  }

  if (!isNew && sequenceId && !existing && sequenceId !== "new") {
    return (
      <div className="flex flex-1 flex-col bg-grey-100 px-6 py-8">
        <p className="text-[14px] text-text-secondary">Reminder sequence not found.</p>
        <Link to="/automation" className="mt-2 text-[14px] font-medium text-blue-600 hover:underline">
          Back to Automation
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col bg-grey-100">
      <div
        ref={scrollRef}
        className={cn(
          "sticky top-0 z-10 shrink-0 border-b border-border-default/60 bg-grey-100 px-6 pt-5 pb-4 transition-shadow duration-200",
          isScrolled && "shadow-[0_2px_8px_rgba(0,0,0,0.04)]",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-text-muted">
              <Link to="/automation" className="transition-colors hover:text-blue-600">
                Offline Invoice Reminders
              </Link>
              <ChevronRight size={12} className="shrink-0 opacity-60" aria-hidden />
              <span className="truncate text-text-secondary">{breadcrumbLabel}</span>
            </nav>

            <div className="flex min-w-0 items-center gap-2">
              {editingTitle ? (
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                  onBlur={(e) => {
                    setEditingTitle(false);
                    persistDraft({ ...draft, name: e.target.value.trim() || draft.name });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingTitle(false);
                      persistDraft(draft);
                    }
                  }}
                  className="min-w-0 flex-1 rounded-md border border-border-default bg-white px-2 py-1 font-sora text-[20px] font-bold text-text-primary outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : (
                <>
                  <h1 className="truncate font-sora text-[20px] font-bold text-text-primary">
                    {draft.name}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setEditingTitle(true)}
                    className="rounded-md p-1 text-text-muted transition-colors hover:bg-white hover:text-text-primary"
                    aria-label="Edit sequence name"
                  >
                    <Pencil size={14} strokeWidth={2} aria-hidden />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span className="text-[12px] text-text-muted">{lastSavedLabel}</span>
            {!isNew && draft.id !== "seq_default" ? (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-50"
                aria-label="Delete reminder sequence"
              >
                <Trash2 size={16} strokeWidth={2} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleClose}
              className="text-[13px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Close
            </button>
            <button
              type="button"
              onClick={goPrevious}
              disabled={isFirstStep}
              className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={14} aria-hidden />
              Previous
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep ? <ChevronRight size={14} aria-hidden /> : null}
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-border-default/60 pt-4">
          <ReminderSequenceStepper activeStep={activeStep} onStepChange={setActiveStep} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <div className="mx-auto w-full max-w-[920px]">
          {activeStep === "segment" ? (
            <section className="overflow-hidden rounded-3xl border border-border-default bg-white px-6 py-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-sora text-[15px] font-bold text-text-primary">Conditions</h2>
                  <p className="mt-1 max-w-2xl text-[13px] leading-snug text-text-muted">
                    Set the conditions that define when a email sequence should be applied (e.g.,
                    Invoice amount is more than 2000)
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-border-default bg-white px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                >
                  Import from segments
                  <ChevronDown size={14} aria-hidden />
                </button>
              </div>
              <ReminderConditionsBuilder
                conditions={draft.conditions}
                onChange={(conditions) => patchDraft({ conditions })}
              />
            </section>
          ) : null}

          {activeStep === "email-sequence" ? (
            <ReminderEmailActionsSection
              emails={draft.emails}
              onChange={(emails) => patchDraft({ emails })}
            />
          ) : null}

          {activeStep === "settings" ? (
            <section className="overflow-hidden rounded-3xl border border-border-default bg-white px-6 py-5">
              <h2 className="mb-4 font-sora text-[15px] font-bold text-text-primary">Settings</h2>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border-default bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">Enable sequence</p>
                  <p className="mt-0.5 text-[12px] text-text-muted">
                    When off, this sequence is skipped during matching.
                  </p>
                </div>
                <CompactToggleSwitch
                  checked={draft.enabled}
                  onChange={(enabled) => patchDraft({ enabled })}
                  aria-label="Enable reminder sequence"
                />
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
