import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { Check, ExternalLink, StickyNote } from "lucide-react";
import type { Invoice } from "@/data/mock-data";
import { addPromiseToPay } from "@/data/billing-data";
import { SectionCard } from "@/components/ui/primitives";
import { FieldStack, FormField, PrefixInput } from "@/components/ui/form-field";
import { PromiseToPayDateInput } from "./PromiseToPayDateInput";
import { currency, cn, shortDate } from "@/lib/utils";
import { PromiseToPayNoteTextarea } from "./promise-to-pay-note-textarea";
import { usePaymentCollectionsChrome } from "./PaymentCollectionsChromeContext";
import {
  type AddPromiseAmountPresetId,
  type AddPromiseDatePresetId,
  type AddPromiseToPayDraft,
} from "./add-promise-draft";

type DatePresetId = AddPromiseDatePresetId;
type AmountPresetId = AddPromiseAmountPresetId;

const PRESET_PILL_CLASS =
  "group/preset inline-flex items-center rounded-full border border-border-default bg-white px-3 py-1.5 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white";

const PRESET_PILL_SELECTED_CLASS =
  "border-blue-600 bg-blue-50 text-blue-800 shadow-sm ring-1 ring-blue-200/90 hover:bg-blue-50";

const INVOICE_PILL_CLASS =
  "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium transition-colors";

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

const AMOUNT_PRESETS: { id: AmountPresetId; label: string }[] = [
  { id: "full-due", label: "Full due" },
  { id: "oldest-due", label: "Oldest due" },
  { id: "other", label: "Pay other amount" },
];

function daysUntilDue(dueDate: string): number {
  return Math.round((new Date(dueDate).getTime() - Date.now()) / 86400000);
}

function sumInvoiceAmounts(invoices: Invoice[]): number {
  return invoices.reduce((total, inv) => total + inv.amount, 0);
}

function getOldestDueInvoice(invoices: Invoice[]): Invoice | undefined {
  if (invoices.length === 0) return undefined;
  return [...invoices].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];
}

export function getDueOrOverdueInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => {
    if (inv.status === "Paid") return false;
    if (inv.status === "Overdue") return true;
    const days = daysUntilDue(inv.dueDate);
    return days <= 0 || inv.status === "Pending Review" || inv.status === "On hold";
  });
}

function PresetLabelPair({
  label,
  detail,
}: {
  label: string;
  detail?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-[14px] font-semibold text-text-primary">{label}</span>
      {detail ? (
        <span className="text-[11px] font-medium leading-snug text-text-muted transition-colors group-hover/preset:text-text-secondary">
          {detail}
        </span>
      ) : null}
    </span>
  );
}

interface Props {
  customerId: string;
  loggedByName: string;
  invoices: Invoice[];
  onCancel: () => void;
  onSave: () => void;
}

export function AddPromiseToPayForm({
  customerId,
  loggedByName,
  invoices,
  onCancel,
  onSave,
}: Props) {
  const paymentChrome = usePaymentCollectionsChrome();
  const savedDraft = paymentChrome?.getAddPromiseDraft() ?? null;

  const selectableInvoices = useMemo(() => getDueOrOverdueInvoices(invoices), [invoices]);
  const invoiceById = useMemo(
    () => new Map(selectableInvoices.map((inv) => [inv.id, inv])),
    [selectableInvoices],
  );
  const fullDueTotal = useMemo(
    () => sumInvoiceAmounts(selectableInvoices),
    [selectableInvoices],
  );
  const oldestDueInvoice = useMemo(
    () => getOldestDueInvoice(selectableInvoices),
    [selectableInvoices],
  );

  const [promisedDate, setPromisedDate] = useState(savedDraft?.promisedDate ?? "");
  const [datePreset, setDatePreset] = useState<DatePresetId | null>(
    savedDraft?.datePreset ?? null,
  );
  const [showCustomDateField, setShowCustomDateField] = useState(
    savedDraft?.showCustomDateField ?? false,
  );
  const customDatePickerRef = useRef<HTMLInputElement>(null);
  const customDateFieldRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusAmountRef = useRef(false);
  const [amountPreset, setAmountPreset] = useState<AmountPresetId | null>(
    savedDraft?.amountPreset ?? null,
  );
  const [showAmountInput, setShowAmountInput] = useState(
    savedDraft?.showAmountInput ?? false,
  );
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>(
    savedDraft?.selectedInvoiceIds ?? [],
  );
  const [amount, setAmount] = useState(savedDraft?.amount ?? "");
  const [amountTouched, setAmountTouched] = useState(savedDraft?.amountTouched ?? false);
  const [note, setNote] = useState(savedDraft?.note ?? "");
  const [noteOpen, setNoteOpen] = useState(savedDraft?.noteOpen ?? false);

  const buildDraft = useCallback(
    (): AddPromiseToPayDraft => ({
      promisedDate,
      datePreset,
      showCustomDateField,
      amountPreset,
      showAmountInput,
      selectedInvoiceIds,
      amount,
      amountTouched,
      note,
      noteOpen,
    }),
    [
      promisedDate,
      datePreset,
      showCustomDateField,
      amountPreset,
      showAmountInput,
      selectedInvoiceIds,
      amount,
      amountTouched,
      note,
      noteOpen,
    ],
  );

  useEffect(() => {
    paymentChrome?.persistAddPromiseDraft(buildDraft());
  }, [buildDraft, paymentChrome?.persistAddPromiseDraft]);

  function focusAmountField() {
    if (amountInputRef.current) {
      amountInputRef.current.focus();
      return;
    }
    shouldFocusAmountRef.current = true;
  }

  useEffect(() => {
    if (!showAmountInput || !shouldFocusAmountRef.current) return;
    shouldFocusAmountRef.current = false;
    const t = window.setTimeout(() => amountInputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [showAmountInput]);

  useEffect(() => {
    if (amountTouched || amountPreset === "other") return;
    const sum = selectedInvoiceIds.reduce(
      (total, id) => total + (invoiceById.get(id)?.amount ?? 0),
      0,
    );
    setAmount(sum > 0 ? String(sum) : "");
  }, [selectedInvoiceIds, invoiceById, amountTouched, amountPreset]);

  function toggleInvoice(invoiceId: string) {
    const isSelecting = !selectedInvoiceIds.includes(invoiceId);
    setSelectedInvoiceIds((prev) =>
      isSelecting ? [...prev, invoiceId] : prev.filter((id) => id !== invoiceId),
    );
    if (isSelecting) focusAmountField();
  }

  function handleCustomPickerClick(e: MouseEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    if (datePreset !== "custom") {
      setDatePreset("custom");
      setShowCustomDateField(false);
      setPromisedDate("");
      requestAnimationFrame(() => input.showPicker?.());
      return;
    }
    input.showPicker?.();
  }

  function selectDatePreset(preset: DatePresetId) {
    if (preset === "custom") return;

    setDatePreset(preset);
    setShowCustomDateField(false);
    setPromisedDate(toInputDate(resolvePresetDate(preset)));
  }

  function handleCustomDatePicked(value: string) {
    if (!value) return;
    setPromisedDate(value);
    setDatePreset("custom");
    setShowCustomDateField(true);
    requestAnimationFrame(() => customDateFieldRef.current?.focus());
  }

  function handleCustomDateFieldChange(value: string) {
    setPromisedDate(value);
    if (!value) setShowCustomDateField(false);
  }

  function clearPromisedDate() {
    setPromisedDate("");
    setDatePreset(null);
    setShowCustomDateField(false);
  }

  function selectAmountPreset(preset: AmountPresetId) {
    setAmountPreset(preset);

    if (preset === "full-due") {
      setShowAmountInput(false);
      setSelectedInvoiceIds(selectableInvoices.map((inv) => inv.id));
      setAmount(fullDueTotal > 0 ? String(fullDueTotal) : "");
      setAmountTouched(false);
    } else if (preset === "oldest-due" && oldestDueInvoice) {
      setShowAmountInput(false);
      setSelectedInvoiceIds([oldestDueInvoice.id]);
      setAmount(String(oldestDueInvoice.amount));
      setAmountTouched(false);
    } else if (preset === "other") {
      setShowAmountInput(true);
      setSelectedInvoiceIds([]);
      setAmount("");
      setAmountTouched(true);
      focusAmountField();
    }
  }

  function clearAmountSelection() {
    setAmountPreset(null);
    setShowAmountInput(false);
    setAmount("");
    setAmountTouched(false);
    setSelectedInvoiceIds([]);
  }

  function presetPillClass(selected: boolean): string {
    return cn(PRESET_PILL_CLASS, selected && PRESET_PILL_SELECTED_CLASS);
  }

  function renderDatePresetOption(preset: DatePresetId) {
    if (preset === "custom") {
      return <PresetLabelPair label="Custom date" />;
    }
    const label = DATE_PRESETS.find((p) => p.id === preset)!.label;
    return (
      <PresetLabelPair
        label={label}
        detail={shortDate(toInputDate(resolvePresetDate(preset)))}
      />
    );
  }

  function renderAmountPresetOption(preset: AmountPresetId) {
    const label = AMOUNT_PRESETS.find((p) => p.id === preset)!.label;

    if (preset === "full-due") {
      return (
        <PresetLabelPair
          label={label}
          detail={fullDueTotal > 0 ? currency(fullDueTotal) : undefined}
        />
      );
    }

    if (preset === "oldest-due" && oldestDueInvoice) {
      return (
        <PresetLabelPair label={label} detail={currency(oldestDueInvoice.amount)} />
      );
    }

    if (preset === "oldest-due") {
      return <PresetLabelPair label={label} />;
    }

    return <PresetLabelPair label={label} />;
  }

  function handleSave() {
    const parsedAmount = Number.parseFloat(amount.replace(/,/g, ""));
    if (!promisedDate || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;

    addPromiseToPay({
      customerId,
      promisedDate,
      amount: parsedAmount,
      invoiceIds: selectedInvoiceIds,
      loggedByName,
      note: note.trim() || undefined,
    });

    onSave();
  }

  const parsedAmount = Number.parseFloat(amount.replace(/,/g, ""));
  const hasDateSelection =
    promisedDate.length > 0 &&
    datePreset !== null &&
    (datePreset !== "custom" || showCustomDateField);

  const canSave =
    hasDateSelection &&
    amountPreset !== null &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const showInvoiceSection = amountPreset !== null;

  return (
    <SectionCard title="Add Promise to pay">
      <FieldStack>
        <FormField label="Promised to pay date" htmlFor="ptp-date" required>
          {showCustomDateField ? (
            <PromiseToPayDateInput
              ref={customDateFieldRef}
              id="ptp-date"
              className="w-1/2"
              value={promisedDate}
              onChange={handleCustomDateFieldChange}
              onClear={clearPromisedDate}
            />
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {DATE_PRESETS.map((preset) => {
                if (preset.id === "custom") {
                  return (
                    <label
                      key="custom"
                      className={cn(
                        presetPillClass(datePreset === "custom"),
                        "relative inline-flex cursor-pointer",
                      )}
                    >
                      <span className="pointer-events-none">
                        {renderDatePresetOption("custom")}
                      </span>
                      {!showCustomDateField ? (
                        <input
                          ref={customDatePickerRef}
                          id="ptp-date-picker"
                          type="date"
                          value={promisedDate}
                          onChange={(e) => handleCustomDatePicked(e.target.value)}
                          onClick={handleCustomPickerClick}
                          className="absolute inset-0 z-[1] m-0 size-full cursor-pointer border-0 bg-transparent p-0 opacity-0"
                          aria-label="Pick custom date"
                        />
                      ) : null}
                    </label>
                  );
                }

                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectDatePreset(preset.id)}
                    className={presetPillClass(datePreset === preset.id)}
                  >
                    {renderDatePresetOption(preset.id)}
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        <FormField label="Amount" htmlFor="ptp-amount" required>
          {showAmountInput ? (
            <div className="group flex w-fit min-w-0 max-w-full items-center gap-[24px]">
              <PrefixInput
                id="ptp-amount"
                ref={amountInputRef}
                prefix={
                  <span className="mr-1.5 shrink-0 text-[20px] font-bold leading-none text-text-primary">
                    $
                  </span>
                }
                className="inline-flex h-11 w-max max-w-full border-0 bg-transparent px-0 shadow-none hover:border-0 focus-within:border-0 focus-within:ring-0"
                inputClassName="w-[160px] max-w-full flex-none text-[20px] font-bold tabular-nums leading-none text-text-primary placeholder:text-[20px] placeholder:font-bold placeholder:text-[#B2BACD]"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmountTouched(true);
                  setAmount(e.target.value);
                }}
                placeholder="Enter amount"
              />
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={clearAmountSelection}
                className="hidden shrink-0 text-[12px] font-medium text-text-muted transition-colors group-focus-within:inline-flex hover:text-text-secondary"
              >
                Show options
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {AMOUNT_PRESETS.map((preset) => {
                const needsInvoices =
                  preset.id === "full-due" || preset.id === "oldest-due";
                const disabled =
                  needsInvoices &&
                  (selectableInvoices.length === 0 ||
                    (preset.id === "oldest-due" && !oldestDueInvoice) ||
                    (preset.id === "full-due" && fullDueTotal <= 0));

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => selectAmountPreset(preset.id)}
                    className={presetPillClass(amountPreset === preset.id)}
                  >
                    {renderAmountPresetOption(preset.id)}
                  </button>
                );
              })}
            </div>
          )}
        </FormField>

        {showInvoiceSection ? (
          <FormField label="Invoice" optional>
            {selectableInvoices.length === 0 ? (
              <p className="text-[13px] text-text-muted">No due or overdue invoices available.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {selectableInvoices.map((inv) => {
                  const selected = selectedInvoiceIds.includes(inv.id);
                  const overdue = inv.status === "Overdue" || daysUntilDue(inv.dueDate) < 0;
                  return (
                    <button
                      key={inv.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInvoice(inv.id)}
                      className={cn(
                        INVOICE_PILL_CLASS,
                        "border-border-default bg-white text-text-secondary shadow-sm hover:bg-gray-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-3 w-3 shrink-0 items-center justify-center rounded-full border",
                          selected
                            ? "border-blue-600 bg-blue-600 text-white"
                            : overdue
                              ? "border-red-200 bg-red-50 text-red-600"
                              : "border-border-default bg-gray-50 text-text-muted",
                        )}
                      >
                        {selected ? (
                          <Check className="h-2 w-2" strokeWidth={3} aria-hidden />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          selected ? "font-medium text-blue-800" : "text-text-secondary",
                        )}
                      >
                        {inv.id}: {currency(inv.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          paymentChrome?.openInvoiceFromCollectionsFlow(inv.id);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="inline-flex shrink-0 items-center rounded-sm p-0.5 text-text-secondary transition-colors hover:bg-gray-100 hover:text-blue-600"
                        aria-label={`View ${inv.id}`}
                      >
                        <ExternalLink className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
                      </button>
                    </button>
                  );
                })}
              </div>
            )}
          </FormField>
        ) : null}

        <div className="flex flex-col gap-1.5">
          {!noteOpen ? (
            <button
              type="button"
              onClick={() => setNoteOpen(true)}
              className="inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              <StickyNote className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              Add note
            </button>
          ) : (
            <FormField label="Note" htmlFor="ptp-note" optional>
              <PromiseToPayNoteTextarea id="ptp-note" value={note} onChange={setNote} />
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
