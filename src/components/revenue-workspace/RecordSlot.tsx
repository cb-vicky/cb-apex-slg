import { createContext, useContext } from "react";

/**
 * Portal target for the per-record context bar (the glass card that sits inside
 * the sticky CustomerContextBar). Stage content components own their actions
 * and ID semantics — they render `RecordHeader` which uses this context to
 * portal into the sticky shell.
 */
export const RecordSlotContext = createContext<HTMLElement | null>(null);

export function useRecordSlot(): HTMLElement | null {
  return useContext(RecordSlotContext);
}
