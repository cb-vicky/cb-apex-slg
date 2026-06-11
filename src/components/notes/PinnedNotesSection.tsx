import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pin, ChevronUp, ChevronDown } from "lucide-react";
import { cn, shortDate } from "@/lib/utils";
import { useNotesStore } from "@/hooks/useNotesStore";
import { getTabLabel, type Note } from "@/data/notes-data";
import { AddNoteCTA } from "./AddNoteCTA";

interface PinnedNotesSectionProps {
  customerId: string;
  customerName: string;
}

function StackedPinnedNoteCard({
  note,
  onNavigate,
  onTogglePin,
  isActive,
  stackIndex,
  totalCount,
}: {
  note: Note;
  onNavigate: () => void;
  onTogglePin: () => void;
  isActive: boolean;
  stackIndex: number;
  totalCount: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const initials = note.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Smooth card shuffle animation values
  const stackOffset = stackIndex * 5;
  const stackScale = 1 - stackIndex * 0.03;

  return (
    <div
      className={cn(
        "group absolute inset-x-0 top-0 w-full rounded-xl border px-3 py-2.5 text-left cursor-pointer",
        isActive
          ? "border-blue-200 bg-blue-50 shadow-sm hover:border-blue-300 hover:bg-blue-100"
          : "border-blue-200 bg-blue-100 shadow-[0_1px_2px_rgba(0,0,0,0.06)] pointer-events-none",
      )}
      style={{
        transform: `translateY(${stackOffset}px) scale(${stackScale})`,
        zIndex: totalCount - stackIndex,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease",
      }}
      onClick={isActive ? onNavigate : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={isActive ? "button" : undefined}
      tabIndex={isActive ? 0 : -1}
      onKeyDown={isActive ? (e) => { if (e.key === "Enter" || e.key === " ") onNavigate(); } : undefined}
    >
      {/* Compact view: Avatar + Text */}
      <div className="flex items-start gap-2.5 pr-8">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-[13px] font-medium leading-snug text-blue-900 transition-all duration-200",
            isActive && isHovered ? "line-clamp-none" : "line-clamp-1",
          )}>
            {note.text}
          </p>
        </div>
      </div>
      
      {/* Pin button - clickable to unpin */}
      {isActive && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="absolute top-2.5 right-2.5 rounded-md p-1 text-blue-600 transition-colors hover:bg-blue-100"
          title="Unpin from Overview"
        >
          <Pin size={12} fill="currentColor" />
        </button>
      )}

      {/* Hover reveal: Author, date, location */}
      {isActive && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-blue-200/50 pt-1.5 mt-1.5 text-[11px] text-blue-500 transition-all duration-200",
            isHovered ? "opacity-100 max-h-10" : "opacity-0 max-h-0 overflow-hidden mt-0 pt-0 border-t-0",
          )}
        >
          <span className="font-medium text-blue-700">{note.author.name}</span>
          <span>·</span>
          <span>{shortDate(note.timestamp)}</span>
          <span>·</span>
          <span className="text-blue-600">{getTabLabel(note.tab, note.subTab)}</span>
        </div>
      )}
    </div>
  );
}

export function PinnedNotesSection({
  customerId,
  customerName,
}: PinnedNotesSectionProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const {
    notes,
    setCustomerContext,
    setDrawerLocation,
    highlightNote,
    sortNotes,
    togglePin,
  } = useNotesStore();

  // Update context
  useEffect(() => {
    setCustomerContext(customerId, customerName);
    setDrawerLocation({ tab: "customer" }, customerId, customerName);
  }, [customerId, customerName, setCustomerContext, setDrawerLocation]);

  // Get all active notes for this customer (pinned first)
  const activeNotes = useMemo(() => {
    return sortNotes(notes.filter((n) => n.customerId === customerId && !n.isResolved));
  }, [notes, customerId, sortNotes]);

  const pinnedNotes = useMemo(() => {
    return activeNotes.filter((n) => n.isPinned);
  }, [activeNotes]);

  // Reset index when notes change
  useEffect(() => {
    if (currentIndex >= pinnedNotes.length && pinnedNotes.length > 0) {
      setCurrentIndex(0);
    }
  }, [pinnedNotes.length, currentIndex]);

  const handleNavigateToNote = (note: Note) => {
    // For notes in the current "customer" tab, just highlight in place
    if (note.tab === "customer") {
      highlightNote(note.id, 3);
      return;
    }

    const baseUrl = `/customers/${note.customerId}`;
    const tabParam = `tab=${note.tab}`;
    const subParam = note.subTab ? `sub=${note.subTab}` : "";
    const params = [tabParam, subParam].filter(Boolean).join("&");
    const url = `${baseUrl}?${params}`;

    // Set highlight BEFORE navigation so it persists across route change
    highlightNote(note.id, 3);

    // Use React Router for SPA navigation
    navigate(url);
  };

  const handleNavigate = (newIndex: number) => {
    if (isAnimating || newIndex === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? pinnedNotes.length - 1 : currentIndex - 1;
    handleNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === pinnedNotes.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(newIndex);
  };

  // Empty state - just the CTA aligned right
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

  // No pinned notes but has active notes - show CTA
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

  // Max 3 cards in stack for visual effect
  const visibleStackCount = Math.min(pinnedNotes.length, 3);
  const stackHeight = 44 + (visibleStackCount - 1) * 5;

  // Calculate stack position for each card relative to current index
  const getStackPosition = (idx: number): number => {
    if (idx === currentIndex) return 0;
    
    // Calculate relative position in the circular list
    const len = pinnedNotes.length;
    const diff = idx - currentIndex;
    const normalizedDiff = ((diff % len) + len) % len;
    
    // Cards after current get higher stack positions
    if (normalizedDiff <= visibleStackCount - 1) {
      return normalizedDiff;
    }
    
    // Cards that wrap around appear at the back
    return visibleStackCount;
  };

  const hasMultiple = pinnedNotes.length > 1;

  return (
    <div className={cn("flex gap-2", hasMultiple ? "items-stretch" : "")}>
      {/* Stacked cards container */}
      <div 
        className={cn("relative", hasMultiple ? "flex-1" : "w-full")}
        style={{ height: `${stackHeight}px` }}
      >
        {pinnedNotes.map((note, idx) => {
          const stackPosition = getStackPosition(idx);
          const isVisible = stackPosition < visibleStackCount;
          
          if (!isVisible) return null;
          
          return (
            <StackedPinnedNoteCard
              key={note.id}
              note={note}
              onNavigate={() => handleNavigateToNote(note)}
              onTogglePin={() => togglePin(note.id)}
              isActive={idx === currentIndex}
              stackIndex={stackPosition}
              totalCount={visibleStackCount}
            />
          );
        })}
      </div>

      {/* Vertical carousel controls - only show if multiple pinned notes */}
      {hasMultiple && (
        <div className="flex flex-col items-center justify-center gap-0 px-0.5">
          <button
            type="button"
            onClick={handlePrev}
            disabled={isAnimating}
            className="rounded p-0 text-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            aria-label="Previous note"
          >
            <ChevronUp size={12} />
          </button>

          {/* Symbolic indicator: show dots if <= 3, otherwise show "n/total" */}
          {pinnedNotes.length <= 3 ? (
            <div className="flex flex-col items-center gap-0.5">
              {pinnedNotes.map((note, idx) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => handleNavigate(idx)}
                  disabled={isAnimating}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    idx === currentIndex
                      ? "h-1.5 w-1.5 bg-blue-500"
                      : "h-1 w-1 bg-blue-300 hover:bg-blue-400",
                  )}
                  aria-label={`Go to note ${idx + 1}`}
                />
              ))}
            </div>
          ) : (
            <div className="text-[9px] font-medium text-blue-500 tabular-nums leading-none">
              {currentIndex + 1}/{pinnedNotes.length}
            </div>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isAnimating}
            className="rounded p-0 text-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50"
            aria-label="Next note"
          >
            <ChevronDown size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
