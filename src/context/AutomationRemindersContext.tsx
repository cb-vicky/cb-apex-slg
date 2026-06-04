import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_OFFLINE_REMINDER,
  OFFLINE_REMINDER_SEQUENCES,
  deriveCriteriaLabel,
  deriveEmailBounds,
  type OfflineReminderSequence,
} from "@/data/offline-invoice-reminders";

interface AutomationRemindersContextValue {
  sequences: OfflineReminderSequence[];
  defaultReminder: OfflineReminderSequence;
  getSequence: (id: string) => OfflineReminderSequence | undefined;
  upsertSequence: (sequence: OfflineReminderSequence) => void;
  deleteSequence: (id: string) => void;
  reorderSequences: (fromIndex: number, toIndex: number) => void;
  updateDefaultReminder: (patch: Partial<OfflineReminderSequence>) => void;
}

const AutomationRemindersContext = createContext<AutomationRemindersContextValue | null>(null);

export function AutomationRemindersProvider({ children }: { children: ReactNode }) {
  const [sequences, setSequences] = useState<OfflineReminderSequence[]>(OFFLINE_REMINDER_SEQUENCES);
  const [defaultReminder, setDefaultReminder] = useState<OfflineReminderSequence>(
    DEFAULT_OFFLINE_REMINDER,
  );

  const getSequence = useCallback(
    (id: string) => {
      if (id === defaultReminder.id) return defaultReminder;
      return sequences.find((seq) => seq.id === id);
    },
    [defaultReminder, sequences],
  );

  const upsertSequence = useCallback((sequence: OfflineReminderSequence) => {
    const bounds = deriveEmailBounds(sequence.emails);
    const next = {
      ...sequence,
      ...bounds,
      criteriaLabel: deriveCriteriaLabel(sequence.conditions),
    };
    if (next.id === DEFAULT_OFFLINE_REMINDER.id) {
      setDefaultReminder(next);
      return;
    }
    setSequences((prev) => {
      const index = prev.findIndex((seq) => seq.id === next.id);
      if (index === -1) return [...prev, next];
      const copy = [...prev];
      copy[index] = next;
      return copy;
    });
  }, []);

  const deleteSequence = useCallback((id: string) => {
    if (id === DEFAULT_OFFLINE_REMINDER.id) return;
    setSequences((prev) => prev.filter((seq) => seq.id !== id));
  }, []);

  const reorderSequences = useCallback((fromIndex: number, toIndex: number) => {
    setSequences((prev) => {
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= prev.length || toIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const updateDefaultReminder = useCallback((patch: Partial<OfflineReminderSequence>) => {
    setDefaultReminder((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      sequences,
      defaultReminder,
      getSequence,
      upsertSequence,
      deleteSequence,
      reorderSequences,
      updateDefaultReminder,
    }),
    [
      sequences,
      defaultReminder,
      getSequence,
      upsertSequence,
      deleteSequence,
      reorderSequences,
      updateDefaultReminder,
    ],
  );

  return (
    <AutomationRemindersContext.Provider value={value}>{children}</AutomationRemindersContext.Provider>
  );
}

export function useAutomationReminders() {
  const ctx = useContext(AutomationRemindersContext);
  if (!ctx) {
    throw new Error("useAutomationReminders must be used within AutomationRemindersProvider");
  }
  return ctx;
}
