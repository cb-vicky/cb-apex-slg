import { useEffect, useMemo } from "react";
import { useNotesStore } from "@/hooks/useNotesStore";
import { AddNoteCTA } from "./AddNoteCTA";
import { NoteCard } from "./NoteCard";
import type { Stage } from "@/components/revenue-workspace/stage";

interface NotesSectionProps {
  customerId: string;
  customerName: string;
  tab: Stage;
  subTab?: string;
  className?: string;
}

export function NotesSection({
  customerId,
  customerName,
  tab,
  subTab,
  className,
}: NotesSectionProps) {
  const { notes, setDrawerLocation, setCustomerContext, sortNotes } = useNotesStore();

  // Update drawer context when location changes
  useEffect(() => {
    setCustomerContext(customerId, customerName);
    setDrawerLocation({ tab, subTab }, customerId, customerName);
  }, [customerId, customerName, tab, subTab, setDrawerLocation, setCustomerContext]);

  // Get active notes for this location
  const locationNotes = useMemo(() => {
    return sortNotes(
      notes.filter(
        (n) =>
          n.customerId === customerId &&
          n.tab === tab &&
          !n.isResolved &&
          (subTab === undefined || n.subTab === subTab),
      ),
    );
  }, [notes, customerId, tab, subTab, sortNotes]);

  return (
    <div className={className}>
      {locationNotes.length > 0 ? (
        <NoteCard notes={locationNotes} />
      ) : (
        <div className="flex justify-end">
          <AddNoteCTA
            customerId={customerId}
            customerName={customerName}
            tab={tab}
            subTab={subTab}
            className="w-full sm:w-[40%]"
          />
        </div>
      )}
    </div>
  );
}
