import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Pin,
  PinOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  RotateCcw,
  Send,
  StickyNote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn, shortDate } from "@/lib/utils";
import { useNotesStore } from "@/hooks/useNotesStore";
import { getTabLabel, type Note } from "@/data/notes-data";

// ---------------------------------------------------------------------------
// Note List Item
// ---------------------------------------------------------------------------

function NoteListItem({
  note,
  isEditing,
  showCustomerName,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onTogglePin,
  onResolve,
  onUnresolve,
  onNavigate,
}: {
  note: Note;
  isEditing: boolean;
  showCustomerName?: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (text: string) => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onResolve: () => void;
  onUnresolve: () => void;
  onNavigate: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editText, setEditText] = useState(note.text);
  const menuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const initials = note.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing, editText.length]);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSave = () => {
    if (editText.trim()) {
      onSaveEdit(editText.trim());
    }
  };

  return (
    <article
      className={cn(
        "group relative border-b border-gray-100 px-4 py-3.5 transition-colors last:border-0",
        !note.isResolved && "hover:bg-blue-50/30",
        note.isResolved && "bg-gray-50/50 opacity-75",
      )}
    >
      {/* Location pill + pin button row */}
      <div className="mb-2 flex items-center gap-2">
        {showCustomerName && (
          <button
            type="button"
            onClick={onNavigate}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100"
          >
            <span className="truncate max-w-[120px]">
              {note.customerName}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-medium text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100"
        >
          <span className="truncate max-w-[200px]">
            {getTabLabel(note.tab, note.subTab)}
          </span>
        </button>

        {note.isNew && !note.isResolved && (
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-blue-500" />
        )}

        <div className="ml-auto flex items-center gap-1">
          {!note.isResolved && (
            <button
              type="button"
              onClick={onTogglePin}
              className={cn(
                "rounded-md p-1 transition-colors",
                note.isPinned
                  ? "text-blue-600 hover:bg-blue-50"
                  : "text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600",
              )}
              title={note.isPinned ? "Unpin note" : "Pin to Overview"}
            >
              {note.isPinned ? (
                <Pin size={13} fill="currentColor" />
              ) : (
                <PinOff size={13} />
              )}
            </button>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-md p-1 text-gray-400 opacity-0 transition-colors group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-600"
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {!note.isResolved && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={13} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onResolve();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                    >
                      <CheckCircle2 size={13} />
                      Resolve
                    </button>
                  </>
                )}
                {note.isResolved && (
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onUnresolve();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-gray-700 hover:bg-gray-50"
                  >
                    <RotateCcw size={13} />
                    Unresolve
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Author + content */}
      <div className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#012A38] text-[10px] font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[13px] font-semibold text-gray-900">
              {note.author.name}
            </span>
            <span className="ml-auto shrink-0 text-[11px] text-gray-400">
              {shortDate(note.timestamp)}
            </span>
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                ref={textareaRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-gray-700 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
              />
              <div className="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCancelEdit}
                  className="rounded-md px-3 py-1 text-[12px] font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-md bg-blue-600 px-3 py-1 text-[12px] font-medium text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              {note.text}
            </p>
          )}
        </div>
      </div>

      {note.isResolved && (
        <div className="mt-2 ml-9 flex items-center gap-1.5 text-[11px] text-gray-400">
          <CheckCircle2 size={11} />
          <span>Resolved</span>
        </div>
      )}
    </article>
  );
}

// ---------------------------------------------------------------------------
// Note Composer
// ---------------------------------------------------------------------------

function NoteComposer({
  onSubmit,
  locationLabel,
  disabled,
}: {
  onSubmit: (text: string) => void;
  locationLabel: string;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (text.trim() && !disabled) {
      onSubmit(text.trim());
      setText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50/50 p-4">
      {locationLabel && (
        <div className="mb-2 text-[11px] text-gray-500">
          Adding to: <span className="font-medium text-gray-700">{locationLabel}</span>
        </div>
      )}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "Select a customer to add notes" : "Add a note..."}
          disabled={disabled}
          className={cn(
            "w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-[13px] leading-relaxed text-gray-700 placeholder:text-gray-400 focus:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100",
            disabled && "cursor-not-allowed bg-gray-100 opacity-60",
          )}
          rows={3}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          className={cn(
            "absolute bottom-3 right-3 rounded-lg p-1.5 transition-colors",
            text.trim() && !disabled
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-400",
          )}
        >
          <Send size={14} />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-gray-400">
        Press <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[10px]">⌘</kbd> +{" "}
        <kbd className="rounded bg-gray-200 px-1 py-0.5 font-mono text-[10px]">Enter</kbd> to send
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notes Drawer
// ---------------------------------------------------------------------------

export function NotesDrawer() {
  const navigate = useNavigate();
  const {
    notes,
    drawer,
    editingNoteId,
    closeDrawer,
    setDrawerTab,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    resolveNote,
    unresolveNote,
    highlightNote,
    markAsRead,
    setEditingNote,
    sortNotes,
  } = useNotesStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Filter notes based on current context
  const customerNotes = drawer.currentCustomerId
    ? notes.filter((n) => n.customerId === drawer.currentCustomerId)
    : notes;

  const activeNotes = sortNotes(customerNotes.filter((n) => !n.isResolved));
  const resolvedNotes = sortNotes(customerNotes.filter((n) => n.isResolved));

  const displayNotes = drawer.activeTab === "active" ? activeNotes : resolvedNotes;

  // Get location label for composer
  const locationLabel = drawer.currentLocation
    ? getTabLabel(drawer.currentLocation.tab, drawer.currentLocation.subTab)
    : drawer.currentCustomerId
      ? "Overview"
      : "";

  // Handle escape key
  useEffect(() => {
    if (!drawer.isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (editingNoteId) {
          setEditingNote(null);
        } else {
          closeDrawer();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawer.isOpen, editingNoteId, closeDrawer, setEditingNote]);

  // Mark notes as read when viewing
  useEffect(() => {
    if (drawer.isOpen) {
      displayNotes.forEach((n) => {
        if (n.isNew) markAsRead(n.id);
      });
    }
  }, [drawer.isOpen, displayNotes, markAsRead]);

  const handleAddNote = (text: string) => {
    if (!drawer.currentCustomerId || !drawer.currentCustomerName) return;

    addNote({
      customerId: drawer.currentCustomerId,
      customerName: drawer.currentCustomerName,
      tab: drawer.currentLocation?.tab ?? "customer",
      subTab: drawer.currentLocation?.subTab,
      text,
    });
  };

  const handleNavigateToNote = (note: Note) => {
    closeDrawer();

    // Build the URL to navigate to
    const baseUrl = `/customers/${note.customerId}`;
    const tabParam = note.tab === "customer" ? "" : `tab=${note.tab}`;
    const subParam = note.subTab ? `sub=${note.subTab}` : "";
    const params = [tabParam, subParam].filter(Boolean).join("&");
    const url = params ? `${baseUrl}?${params}` : baseUrl;

    // Set highlight BEFORE navigation so it persists across route change
    highlightNote(note.id, 3);

    // Use React Router for SPA navigation
    navigate(url);
  };

  if (!drawer.isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-end">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/10"
        aria-label="Close notes"
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative mr-4 mb-4 flex w-[420px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
        style={{
          maxHeight: "60vh",
          animation: "slideUp 0.2s ease-out",
        }}
        role="dialog"
        aria-labelledby="notes-drawer-title"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <StickyNote size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="notes-drawer-title"
              className="text-[14px] font-semibold text-gray-900"
            >
              Notes
            </h2>
            <p className="truncate text-[12px] text-gray-500">
              {drawer.currentCustomerName ?? "All customers"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close notes drawer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-gray-100 px-4">
          <button
            type="button"
            onClick={() => setDrawerTab("active")}
            className={cn(
              "relative px-4 py-2.5 text-[13px] font-medium transition-colors",
              drawer.activeTab === "active"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Active
            {activeNotes.length > 0 && (
              <span className="ml-1.5 text-[11px] text-gray-400">
                ({activeNotes.length})
              </span>
            )}
            {drawer.activeTab === "active" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setDrawerTab("resolved")}
            className={cn(
              "relative px-4 py-2.5 text-[13px] font-medium transition-colors",
              drawer.activeTab === "resolved"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            Resolved
            {resolvedNotes.length > 0 && (
              <span className="ml-1.5 text-[11px] text-gray-400">
                ({resolvedNotes.length})
              </span>
            )}
            {drawer.activeTab === "resolved" && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
            )}
          </button>
        </div>

        {/* Notes list */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {displayNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <StickyNote size={20} className="text-gray-400" />
              </div>
              <p className="text-[13px] text-gray-500">
                {drawer.activeTab === "active"
                  ? "No active notes yet"
                  : "No resolved notes"}
              </p>
              {drawer.activeTab === "active" && (
                <p className="mt-1 text-[12px] text-gray-400">
                  Add a note using the composer below
                </p>
              )}
            </div>
          ) : (
            displayNotes.map((note) => (
              <NoteListItem
                key={note.id}
                note={note}
                isEditing={editingNoteId === note.id}
                showCustomerName={!drawer.currentCustomerId}
                onEdit={() => setEditingNote(note.id)}
                onCancelEdit={() => setEditingNote(null)}
                onSaveEdit={(text) => {
                  updateNote(note.id, { text });
                  setEditingNote(null);
                }}
                onDelete={() => deleteNote(note.id)}
                onTogglePin={() => togglePin(note.id)}
                onResolve={() => resolveNote(note.id)}
                onUnresolve={() => unresolveNote(note.id)}
                onNavigate={() => handleNavigateToNote(note)}
              />
            ))
          )}
        </div>

        {/* Composer (only in active tab) */}
        {drawer.activeTab === "active" && (
          <NoteComposer
            onSubmit={handleAddNote}
            locationLabel={locationLabel}
            disabled={!drawer.currentCustomerId}
          />
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>,
    document.body,
  );
}
