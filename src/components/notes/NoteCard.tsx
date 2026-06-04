import { useState, useEffect, useRef } from "react";
import { Pin, PinOff, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, shortDate } from "@/lib/utils";
import { useNotesStore } from "@/hooks/useNotesStore";
import { getTabLabel, type Note } from "@/data/notes-data";

interface NoteCardProps {
  notes: Note[];
}

function SingleNoteDisplay({
  note,
  onTogglePin,
}: {
  note: Note;
  onTogglePin?: () => void;
}) {
  const { highlightedNote, clearHighlight } = useNotesStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentHighlight = highlightedNote?.noteId === note.id;

  useEffect(() => {
    if (isCurrentHighlight) {
      setIsHighlighted(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      const timeout = setTimeout(() => {
        setIsHighlighted(false);
        clearHighlight();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isCurrentHighlight, clearHighlight]);

  const initials = note.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div
      ref={cardRef}
      data-note-id={note.id}
      className={cn(
        "group relative rounded-xl border px-3 py-2.5 transition-all duration-300",
        isHighlighted
          ? "border-blue-400 bg-blue-100 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
          : "border-blue-200 bg-blue-50/80 hover:border-blue-300 hover:bg-blue-50",
      )}
      style={{
        animation: isHighlighted ? "highlightWash 0.5s ease-out 3" : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact view: Avatar + Text */}
      <div className="flex items-start gap-2.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-[13px] font-medium leading-snug text-blue-900 transition-all duration-200",
            isHovered ? "line-clamp-none" : "line-clamp-1",
          )}>
            {note.text}
          </p>
        </div>
        {/* Pin button - always show if pinned, show on hover if not */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin?.();
          }}
          className={cn(
            "shrink-0 rounded-md p-1 transition-all",
            note.isPinned
              ? "text-blue-600 hover:bg-blue-100"
              : "text-blue-400 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600",
          )}
          title={note.isPinned ? "Unpin from Overview" : "Pin to Overview"}
        >
          {note.isPinned ? (
            <Pin size={12} fill="currentColor" />
          ) : (
            <PinOff size={12} />
          )}
        </button>
      </div>

      {/* Hover reveal: Author, date, location */}
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

      <style>{`
        @keyframes highlightWash {
          0%, 100% {
            background-color: rgb(239 246 255 / 0.8);
          }
          50% {
            background-color: rgb(191 219 254);
          }
        }
      `}</style>
    </div>
  );
}

function StackedNoteCard({
  note,
  onTogglePin,
  isActive,
  stackIndex,
  totalCount,
}: {
  note: Note;
  onTogglePin?: () => void;
  isActive: boolean;
  stackIndex: number;
  totalCount: number;
}) {
  const { highlightedNote, clearHighlight } = useNotesStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isCurrentHighlight = highlightedNote?.noteId === note.id;

  useEffect(() => {
    if (isCurrentHighlight && isActive) {
      setIsHighlighted(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      const timeout = setTimeout(() => {
        setIsHighlighted(false);
        clearHighlight();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isCurrentHighlight, isActive, clearHighlight]);

  const initials = note.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Smooth card shuffle animation values
  const stackOffset = stackIndex * 5;
  const stackScale = 1 - stackIndex * 0.03;
  const stackOpacity = isActive ? 1 : Math.max(0.6, 1 - stackIndex * 0.2);
  const stackBlur = isActive ? 0 : stackIndex * 0.4;

  return (
    <div
      ref={cardRef}
      data-note-id={note.id}
      className={cn(
        "group absolute inset-x-0 top-0 w-full rounded-xl border px-3 py-2.5",
        isActive
          ? isHighlighted
            ? "border-blue-400 bg-blue-100 shadow-[0_0_0_3px_rgba(59,130,246,0.2)]"
            : "border-blue-200 bg-blue-50/80 hover:border-blue-300 hover:bg-blue-50 shadow-sm"
          : "border-blue-100 bg-blue-50/60 pointer-events-none",
      )}
      style={{
        transform: `translateY(${stackOffset}px) scale(${stackScale})`,
        opacity: stackOpacity,
        zIndex: totalCount - stackIndex,
        filter: stackBlur > 0 ? `blur(${stackBlur}px)` : undefined,
        animation: isHighlighted ? "highlightWash 0.5s ease-out 3" : undefined,
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact view: Avatar + Text */}
      <div className="flex items-start gap-2.5">
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
        {/* Pin button - always show if pinned, show on hover if not */}
        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.();
            }}
            className={cn(
              "shrink-0 rounded-md p-1 transition-all",
              note.isPinned
                ? "text-blue-600 hover:bg-blue-100"
                : "text-blue-400 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600",
            )}
            title={note.isPinned ? "Unpin from Overview" : "Pin to Overview"}
          >
            {note.isPinned ? (
              <Pin size={12} fill="currentColor" />
            ) : (
              <PinOff size={12} />
            )}
          </button>
        )}
      </div>

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

      <style>{`
        @keyframes highlightWash {
          0%, 100% {
            background-color: rgb(239 246 255 / 0.8);
          }
          50% {
            background-color: rgb(191 219 254);
          }
        }
      `}</style>
    </div>
  );
}

export function NoteCard({ notes }: NoteCardProps) {
  const { highlightedNote, sortNotes, togglePin } = useNotesStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const sortedNotes = sortNotes(notes);
  const hasMultiple = sortedNotes.length > 1;
  const currentNote = sortedNotes[currentIndex];

  // Reset index when notes change
  useEffect(() => {
    if (currentIndex >= sortedNotes.length) {
      setCurrentIndex(0);
    }
  }, [sortedNotes.length, currentIndex]);

  // Navigate to highlighted note if it's in this card
  useEffect(() => {
    if (highlightedNote) {
      const noteIndex = sortedNotes.findIndex((n) => n.id === highlightedNote.noteId);
      if (noteIndex !== -1 && noteIndex !== currentIndex) {
        setCurrentIndex(noteIndex);
      }
    }
  }, [highlightedNote, sortedNotes, currentIndex]);

  const handleNavigate = (newIndex: number) => {
    if (isAnimating || newIndex === currentIndex) return;
    setIsAnimating(true);
    setCurrentIndex(newIndex);
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handlePrev = () => {
    const newIndex = currentIndex === 0 ? sortedNotes.length - 1 : currentIndex - 1;
    handleNavigate(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex === sortedNotes.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(newIndex);
  };

  if (sortedNotes.length === 0 || !currentNote) return null;

  // Single note - simple display
  if (!hasMultiple) {
    return (
      <SingleNoteDisplay
        note={currentNote}
        onTogglePin={() => togglePin(currentNote.id)}
      />
    );
  }

  // Multiple notes - stacked cards with fluid animation
  const visibleStackCount = Math.min(sortedNotes.length, 3);
  const stackHeight = 44 + (visibleStackCount - 1) * 5;

  // Calculate stack position for each card relative to current index
  const getStackPosition = (idx: number): number => {
    if (idx === currentIndex) return 0;
    
    // Calculate relative position in the circular list
    const len = sortedNotes.length;
    const diff = idx - currentIndex;
    const normalizedDiff = ((diff % len) + len) % len;
    
    // Cards after current get higher stack positions
    if (normalizedDiff <= visibleStackCount - 1) {
      return normalizedDiff;
    }
    
    // Cards that wrap around appear at the back
    return visibleStackCount;
  };

  return (
    <div>
      {/* Stacked cards container */}
      <div 
        className="relative"
        style={{ height: `${stackHeight}px` }}
      >
        {sortedNotes.map((note, idx) => {
          const stackPosition = getStackPosition(idx);
          const isVisible = stackPosition < visibleStackCount;
          
          if (!isVisible) return null;
          
          return (
            <StackedNoteCard
              key={note.id}
              note={note}
              onTogglePin={() => togglePin(note.id)}
              isActive={idx === currentIndex}
              stackIndex={stackPosition}
              totalCount={visibleStackCount}
            />
          );
        })}
      </div>

      {/* Carousel controls */}
      <div className="mt-1.5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isAnimating}
          className="rounded-full p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
          aria-label="Previous note"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {sortedNotes.map((note, idx) => (
            <button
              key={note.id}
              type="button"
              onClick={() => handleNavigate(idx)}
              disabled={isAnimating}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentIndex
                  ? "w-4 bg-blue-500"
                  : "w-1.5 bg-blue-200 hover:bg-blue-300",
              )}
              aria-label={`Go to note ${idx + 1}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isAnimating}
          className="rounded-full p-1.5 text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors disabled:opacity-50"
          aria-label="Next note"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

