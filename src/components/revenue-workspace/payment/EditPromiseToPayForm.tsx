import { useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { editPromiseToPayLog } from "@/data/billing-data";
import { SectionCard } from "@/components/ui/primitives";
import { FieldStack, FormField, PrefixInput } from "@/components/ui/form-field";
import { PromiseToPayDateInput } from "./PromiseToPayDateInput";
import { shortDate } from "@/lib/utils";
import { PromiseToPayAssociatedInvoices } from "./PromiseToPayAssociatedInvoices";
import { PromiseToPayNoteTextarea } from "./promise-to-pay-note-textarea";

type DatePresetId = "week" | "two-weeks" | "month" | "custom";

function toInputDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(base: Date, months: number): Date {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function resolvePresetDate(preset: Exclude<DatePresetId, "custom">, base = new Date()): Date {
  switch (preset) {
    case "week":
      return addDays(base, 7);
    case "two-weeks":
      return addDays(base, 14);
    case "month":
      return addMonths(base, 1);
  }
}

const DATE_PRESETS: { id: DatePresetId; label: string }[] = [
  { id: "week", label: "In a week" },
  { id: "two-weeks", label: "In 2 weeks" },
  { id: "month", label: "In 1 month" },
  { id: "custom", label: "Custom date" },
];

interface Props {
  customerId: string;
  loggedByName: string;
  promiseId: string;
  logId: string;
  invoiceIds: string[];
  initialPromisedDate: string;
  initialAmount: number;
  initialNote?: string;
  onCancel: () => void;
  onSave: () => void;
}

export function EditPromiseToPayForm({
  customerId,
  loggedByName,
  promiseId,
  logId,
  invoiceIds,
  initialPromisedDate,
  initialAmount,
  initialNote = "",
  onCancel,
  onSave,
}: Props) {
  const [promisedDate, setPromisedDate] = useState(initialPromisedDate);
  const [showDateField, setShowDateField] = useState(true);
  const [amount, setAmount] = useState(String(initialAmount));
  const [note, setNote] = useState(initialNote);
  const [noteOpen, setNoteOpen] = useState(initialNote.trim().length > 0);
  const customDateInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  function focusAmountField() {
    requestAnimationFrame(() => amountInputRef.current?.focus());
  }

  function selectDatePreset(preset: DatePresetId) {
    setShowDateField(true);
    if (preset === "custom") {
      requestAnimationFrame(() => {
        customDateInputRef.current?.showPicker?.();
        customDateInputRef.current?.focus();
      });
      return;
    }
    setPromisedDate(toInputDate(resolvePresetDate(preset)));
    focusAmountField();
  }

  function handlePromisedDateChange(value: string) {
    setPromisedDate(value);
    if (value) focusAmountField();
  }

  function clearPromisedDate() {
    setPromisedDate("");
    setShowDateField(false);
  }

  function renderPresetOption(preset: DatePresetId) {
    if (preset === "custom") {
      return <span className="text-[14px] font-semibold text-text-primary">Custom date</span>;
    }
    const label = DATE_PRESETS.find((p) => p.id === preset)!.label;
    const dateLabel = shortDate(toInputDate(resolvePresetDate(preset)));
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="text-[14px] font-semibold text-text-primary">{label}</span>
        <span className="text-[11px] font-medium leading-snug text-text-muted transition-colors group-hover/preset:text-text-secondary">
          {dateLabel}
        </span>
      </span>
    );
  }

  function handleSave() {
    const parsedAmount = Number.parseFloat(amount.replace(/,/g, ""));
    if (!promisedDate || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    editPromiseToPayLog({
      customerId,
      promiseId,
      logId,
      promisedDate,
      amount: parsedAmount,
      loggedByName,
      note: note.trim() || undefined,
    });

    onSave();
  }

  const canSave =
    promisedDate.length > 0 &&
    Number.isFinite(Number.parseFloat(amount.replace(/,/g, ""))) &&
    Number.parseFloat(amount.replace(/,/g, "")) > 0;

  return (
    <SectionCard title="Edit Promise to pay">
      <FieldStack>
        <FormField label="Associated invoices">
          <div className="rounded-md border border-border-subtle bg-gray-50 px-3 py-2.5">
            <PromiseToPayAssociatedInvoices
              invoiceIds={invoiceIds}
              emptyLabel="No invoices linked"
            />
          </div>
        </FormField>

        <FormField label="Promised to pay date" htmlFor="edit-ptp-date" required>
          {showDateField ? (
            <PromiseToPayDateInput
              ref={customDateInputRef}
              id="edit-ptp-date"
              className="w-1/2"
              value={promisedDate}
              onChange={handlePromisedDateChange}
              onClear={clearPromisedDate}
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => selectDatePreset(preset.id)}
                  className="group/preset inline-flex items-center rounded-full border border-border-default bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50"
                >
                  {renderPresetOption(preset.id)}
                </button>
              ))}
            </div>
          )}
        </FormField>

        <FormField label="Amount" htmlFor="edit-ptp-amount" required>
          <PrefixInput
            id="edit-ptp-amount"
            ref={amountInputRef}
            prefix="$"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </FormField>

        <div className="flex flex-col gap-1.5">
          {!noteOpen ? (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              <StickyNote className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              {initialNote.trim() ? "Update note" : "Add note"}
            </button>
          ) : (
            <FormField label="Note" htmlFor="edit-ptp-note" optional>
              <PromiseToPayNoteTextarea id="edit-ptp-note" value={note} onChange={setNote} />
            </FormField>
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!canSave}
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-lg border border-border-default bg-white px-4 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </FieldStack>
    </SectionCard>
  );
}
