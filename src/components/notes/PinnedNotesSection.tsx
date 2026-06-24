import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNotesStore } from "@/hooks/useNotesStore";
import { getTabLabel, type Note } from "@/data/notes-data";
import { PinnedCardStack } from "./PinnedCardStack";
import { AddNoteCTA } from "./AddNoteCTA";

interface PinnedNotesSectionProps {
  customerId: string;
  customerName: string;
}

function noteToCard(note: Note) {
  return {
    id: note.id,
    text: note.text,
    authorName: note.author.name,
    timestamp: note.timestamp,
    locationLabel: getTabLabel(note.tab, note.subTab),
  };
}

export function PinnedNotesSection({
  customerId,
  customerName,
}: PinnedNotesSectionProps) {
  const navigate = useNavigate();
  const {
    notes,
    setCustomerContext,
    setDrawerLocation,
    highlightNote,
    sortNotes,
    togglePin,
  } = useNotesStore();

  useEffect(() => {
    setCustomerContext(customerId, customerName);
    setDrawerLocation({ tab: "customer" }, customerId, customerName);
  }, [customerId, customerName, setCustomerContext, setDrawerLocation]);

  const activeNotes = useMemo(() => {
    return sortNotes(notes.filter((n) => n.customerId === customerId && !n.isResolved));
  }, [notes, customerId, sortNotes]);

  const pinnedNotes = useMemo(() => {
    return activeNotes.filter((n) => n.isPinned);
  }, [activeNotes]);

  const pinnedCards = useMemo(() => pinnedNotes.map(noteToCard), [pinnedNotes]);

  const handleNavigateToNote = (noteId: string) => {
    const note = pinnedNotes.find((n) => n.id === noteId);
    if (!note) return;

    if (note.tab === "customer") {
      highlightNote(note.id, 3);
      return;
    }

    const baseUrl = `/customers/${note.customerId}`;
    const tabParam = `tab=${note.tab}`;
    const subParam = note.subTab ? `sub=${note.subTab}` : "";
    const params = [tabParam, subParam].filter(Boolean).join("&");
    const url = `${baseUrl}?${params}`;

    highlightNote(note.id, 3);
    navigate(url);
  };

  if (activeNotes.length === 0) {
    return (
      <div className="flex justify-end">
        <AddNoteCTA
          customerId={customerId}
          customerName={customerName}
          tab="customer"
          className="w-full sm:w-[40%]"
        />
      </div>
    );
  }

  if (pinnedNotes.length === 0) {
    return (
      <div className="flex justify-end">
        <AddNoteCTA
          customerId={customerId}
          customerName={customerName}
          tab="customer"
          className="w-full sm:w-[40%]"
        />
      </div>
    );
  }

  return (
    <PinnedCardStack
      cards={pinnedCards}
      onNavigate={handleNavigateToNote}
      onTogglePin={togglePin}
      unpinTitle="Unpin from Overview"
    />
  );
}
