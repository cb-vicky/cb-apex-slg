export type AddPromiseDatePresetId = "week" | "two-weeks" | "month" | "custom";
export type AddPromiseAmountPresetId = "full-due" | "oldest-due" | "other";

/** In-progress Add Promise to pay form — persisted while viewing a linked invoice. */
export interface AddPromiseToPayDraft {
  promisedDate: string;
  datePreset: AddPromiseDatePresetId | null;
  /** Custom date only — set after native picker confirms a value. */
  showCustomDateField: boolean;
  amountPreset: AddPromiseAmountPresetId | null;
  /** Pay other amount only — manual entry field visible. */
  showAmountInput: boolean;
  selectedInvoiceIds: string[];
  amount: string;
  amountTouched: boolean;
  note: string;
  noteOpen: boolean;
}

export function createEmptyAddPromiseDraft(): AddPromiseToPayDraft {
  return {
    promisedDate: "",
    datePreset: null,
    showCustomDateField: false,
    amountPreset: null,
    showAmountInput: false,
    selectedInvoiceIds: [],
    amount: "",
    amountTouched: false,
    note: "",
    noteOpen: false,
  };
}
