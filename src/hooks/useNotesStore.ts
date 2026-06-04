import { useSyncExternalStore, useCallback } from "react";
import {
  getNotesState,
  subscribeNotes,
  openNotesDrawer,
  closeNotesDrawer,
  setNotesDrawerTab,
  setNotesDrawerLocation,
  setNotesCustomerContext,
  addNote,
  updateNote,
  deleteNote,
  toggleNotePin,
  resolveNote,
  unresolveNote,
  highlightNote,
  clearHighlight,
  markNoteAsRead,
  markAllNotesAsRead,
  setEditingNote,
  getNotesForCustomer,
  getActiveNotesForCustomer,
  getResolvedNotesForCustomer,
  getPinnedNotesForCustomer,
  getNotesForLocation,
  getNewNotesCount,
  getNewNotes,
  sortNotes,
} from "@/store/notes-store";
import type { Stage } from "@/components/revenue-workspace/stage";
import type { Note, NoteLocation } from "@/data/notes-data";

export function useNotesStore() {
  const state = useSyncExternalStore(subscribeNotes, getNotesState);

  return {
    ...state,

    // Drawer actions
    openDrawer: useCallback(
      (options?: {
        location?: NoteLocation;
        customerId?: string;
        customerName?: string;
        tab?: "active" | "resolved";
      }) => openNotesDrawer(options),
      [],
    ),
    closeDrawer: useCallback(() => closeNotesDrawer(), []),
    setDrawerTab: useCallback(
      (tab: "active" | "resolved") => setNotesDrawerTab(tab),
      [],
    ),
    setDrawerLocation: useCallback(
      (location: NoteLocation | null, customerId?: string, customerName?: string) =>
        setNotesDrawerLocation(location, customerId, customerName),
      [],
    ),
    setCustomerContext: useCallback(
      (customerId: string | null, customerName: string | null) =>
        setNotesCustomerContext(customerId, customerName),
      [],
    ),

    // CRUD actions
    addNote: useCallback(
      (params: {
        customerId: string;
        customerName: string;
        tab: Stage;
        subTab?: string;
        text: string;
        isPinned?: boolean;
      }) => addNote(params),
      [],
    ),
    updateNote: useCallback(
      (noteId: string, updates: Partial<Pick<Note, "text" | "isPinned">>) =>
        updateNote(noteId, updates),
      [],
    ),
    deleteNote: useCallback((noteId: string) => deleteNote(noteId), []),
    togglePin: useCallback((noteId: string) => toggleNotePin(noteId), []),
    resolveNote: useCallback((noteId: string) => resolveNote(noteId), []),
    unresolveNote: useCallback((noteId: string) => unresolveNote(noteId), []),

    // Highlight actions
    highlightNote: useCallback(
      (noteId: string, pulseCount?: number) => highlightNote(noteId, pulseCount),
      [],
    ),
    clearHighlight: useCallback(() => clearHighlight(), []),

    // Read/notification actions
    markAsRead: useCallback((noteId: string) => markNoteAsRead(noteId), []),
    markAllAsRead: useCallback(() => markAllNotesAsRead(), []),

    // Edit actions
    setEditingNote: useCallback(
      (noteId: string | null) => setEditingNote(noteId),
      [],
    ),

    // Selectors
    getNotesForCustomer: useCallback(
      (customerId: string) => getNotesForCustomer(customerId),
      [],
    ),
    getActiveNotesForCustomer: useCallback(
      (customerId: string) => getActiveNotesForCustomer(customerId),
      [],
    ),
    getResolvedNotesForCustomer: useCallback(
      (customerId: string) => getResolvedNotesForCustomer(customerId),
      [],
    ),
    getPinnedNotesForCustomer: useCallback(
      (customerId: string) => getPinnedNotesForCustomer(customerId),
      [],
    ),
    getNotesForLocation: useCallback(
      (customerId: string, tab: Stage, subTab?: string) =>
        getNotesForLocation(customerId, tab, subTab),
      [],
    ),
    getNewNotesCount: useCallback(() => getNewNotesCount(), []),
    getNewNotes: useCallback(() => getNewNotes(), []),
    sortNotes: useCallback((notes: Note[]) => sortNotes(notes), []),
  };
}
