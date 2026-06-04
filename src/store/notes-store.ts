// ---------------------------------------------------------------------------
// Notes Store — Global State Management
// ---------------------------------------------------------------------------

import type { Stage } from "@/components/revenue-workspace/stage";
import {
  mockNotes,
  generateNoteId,
  MOCK_AUTHORS,
  type Note,
  type NoteLocation,
} from "@/data/notes-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NotesDrawerState {
  isOpen: boolean;
  activeTab: "active" | "resolved";
  /** When adding from drawer, this is the location to attach the note to */
  currentLocation: NoteLocation | null;
  /** Current customer context (null when on non-customer pages) */
  currentCustomerId: string | null;
  currentCustomerName: string | null;
}

export interface NoteHighlight {
  noteId: string;
  /** Number of times to pulse (for glow animation) */
  pulseCount: number;
}

export interface NotesState {
  notes: Note[];
  drawer: NotesDrawerState;
  /** Note ID currently being highlighted (after navigation) */
  highlightedNote: NoteHighlight | null;
  /** Note IDs that have been "read" (clears isNew flag) */
  readNoteIds: Set<string>;
  /** Note being edited */
  editingNoteId: string | null;
}

type Listener = () => void;

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialDrawerState: NotesDrawerState = {
  isOpen: false,
  activeTab: "active",
  currentLocation: null,
  currentCustomerId: null,
  currentCustomerName: null,
};

const initialState: NotesState = {
  notes: [...mockNotes],
  drawer: initialDrawerState,
  highlightedNote: null,
  readNoteIds: new Set(),
  editingNoteId: null,
};

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

let state: NotesState = initialState;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((l) => l());
}

export function getNotesState(): NotesState {
  return state;
}

export function subscribeNotes(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ---------------------------------------------------------------------------
// Drawer Actions
// ---------------------------------------------------------------------------

export function openNotesDrawer(options?: {
  location?: NoteLocation;
  customerId?: string;
  customerName?: string;
  tab?: "active" | "resolved";
}) {
  state = {
    ...state,
    drawer: {
      isOpen: true,
      activeTab: options?.tab ?? "active",
      currentLocation: options?.location ?? state.drawer.currentLocation,
      currentCustomerId: options?.customerId ?? state.drawer.currentCustomerId,
      currentCustomerName: options?.customerName ?? state.drawer.currentCustomerName,
    },
  };
  emit();
}

export function closeNotesDrawer() {
  state = {
    ...state,
    drawer: {
      ...state.drawer,
      isOpen: false,
    },
    editingNoteId: null,
  };
  emit();
}

export function setNotesDrawerTab(tab: "active" | "resolved") {
  state = {
    ...state,
    drawer: {
      ...state.drawer,
      activeTab: tab,
    },
  };
  emit();
}

export function setNotesDrawerLocation(
  location: NoteLocation | null,
  customerId?: string,
  customerName?: string,
) {
  state = {
    ...state,
    drawer: {
      ...state.drawer,
      currentLocation: location,
      currentCustomerId: customerId ?? state.drawer.currentCustomerId,
      currentCustomerName: customerName ?? state.drawer.currentCustomerName,
    },
  };
  emit();
}

export function setNotesCustomerContext(customerId: string | null, customerName: string | null) {
  state = {
    ...state,
    drawer: {
      ...state.drawer,
      currentCustomerId: customerId,
      currentCustomerName: customerName,
    },
  };
  emit();
}

// ---------------------------------------------------------------------------
// Note CRUD Actions
// ---------------------------------------------------------------------------

export function addNote(params: {
  customerId: string;
  customerName: string;
  tab: Stage;
  subTab?: string;
  text: string;
  isPinned?: boolean;
}): Note {
  const newNote: Note = {
    id: generateNoteId(),
    customerId: params.customerId,
    customerName: params.customerName,
    tab: params.tab,
    subTab: params.subTab,
    text: params.text,
    author: MOCK_AUTHORS[0], // Default to first author for demo
    timestamp: new Date().toISOString(),
    isPinned: params.isPinned ?? false,
    isResolved: false,
    isNew: false,
  };

  state = {
    ...state,
    notes: [newNote, ...state.notes],
  };
  emit();
  return newNote;
}

export function updateNote(noteId: string, updates: Partial<Pick<Note, "text" | "isPinned">>) {
  state = {
    ...state,
    notes: state.notes.map((n) => (n.id === noteId ? { ...n, ...updates } : n)),
  };
  emit();
}

export function deleteNote(noteId: string) {
  state = {
    ...state,
    notes: state.notes.filter((n) => n.id !== noteId),
  };
  emit();
}

export function toggleNotePin(noteId: string) {
  state = {
    ...state,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, isPinned: !n.isPinned } : n,
    ),
  };
  emit();
}

export function resolveNote(noteId: string) {
  state = {
    ...state,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, isResolved: true } : n,
    ),
  };
  emit();
}

export function unresolveNote(noteId: string) {
  state = {
    ...state,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, isResolved: false } : n,
    ),
  };
  emit();
}

// ---------------------------------------------------------------------------
// Highlight Actions (for navigation + glow)
// ---------------------------------------------------------------------------

export function highlightNote(noteId: string, pulseCount = 3) {
  state = {
    ...state,
    highlightedNote: { noteId, pulseCount },
  };
  emit();
}

export function clearHighlight() {
  state = {
    ...state,
    highlightedNote: null,
  };
  emit();
}

// ---------------------------------------------------------------------------
// Read/Notification Actions
// ---------------------------------------------------------------------------

export function markNoteAsRead(noteId: string) {
  const newReadIds = new Set(state.readNoteIds);
  newReadIds.add(noteId);
  state = {
    ...state,
    readNoteIds: newReadIds,
    notes: state.notes.map((n) =>
      n.id === noteId ? { ...n, isNew: false } : n,
    ),
  };
  emit();
}

export function markAllNotesAsRead() {
  state = {
    ...state,
    notes: state.notes.map((n) => ({ ...n, isNew: false })),
    readNoteIds: new Set(state.notes.map((n) => n.id)),
  };
  emit();
}

// ---------------------------------------------------------------------------
// Edit Actions
// ---------------------------------------------------------------------------

export function setEditingNote(noteId: string | null) {
  state = {
    ...state,
    editingNoteId: noteId,
  };
  emit();
}

// ---------------------------------------------------------------------------
// Selectors (Computed Getters)
// ---------------------------------------------------------------------------

export function getNotesForCustomer(customerId: string): Note[] {
  return state.notes.filter((n) => n.customerId === customerId);
}

export function getActiveNotesForCustomer(customerId: string): Note[] {
  return state.notes.filter((n) => n.customerId === customerId && !n.isResolved);
}

export function getResolvedNotesForCustomer(customerId: string): Note[] {
  return state.notes.filter((n) => n.customerId === customerId && n.isResolved);
}

export function getPinnedNotesForCustomer(customerId: string): Note[] {
  return state.notes.filter(
    (n) => n.customerId === customerId && n.isPinned && !n.isResolved,
  );
}

export function getNotesForLocation(
  customerId: string,
  tab: Stage,
  subTab?: string,
): Note[] {
  return state.notes.filter(
    (n) =>
      n.customerId === customerId &&
      n.tab === tab &&
      !n.isResolved &&
      (subTab === undefined || n.subTab === subTab),
  );
}

export function getNewNotesCount(): number {
  return state.notes.filter((n) => n.isNew && !n.isResolved).length;
}

export function getNewNotes(): Note[] {
  return state.notes.filter((n) => n.isNew && !n.isResolved);
}

/** Sort notes - pinned first, then by timestamp descending */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
