import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { CompactToggleSwitch } from "@/components/automation/CompactToggleSwitch";
import { FormField, Input, Select } from "@/components/ui/form-field";
import {
  DEFAULT_EMAIL_FROM,
  REMINDER_EMAIL_LANGUAGES,
  drawerTitleForEmail,
  type ReminderEmailAction,
  type ReminderEmailTiming,
} from "@/data/offline-invoice-reminders";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  initial: ReminderEmailAction;
  onClose: () => void;
  onSave: (email: ReminderEmailAction) => void;
}

export function ReminderEmailActionDrawer({ open, initial, onClose, onSave }: Props) {
  const [draft, setDraft] = useState(initial);

  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function patch(patch: Partial<ReminderEmailAction>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function timingLabel(timing: ReminderEmailTiming): string {
    if (timing === "on-due") return "on due date";
    if (timing === "before-due") return "before due date";
    return "after due date";
  }

  return (
    <div className="fixed inset-0 z-[70] flex">
      <button
        type="button"
        className="h-full w-[25%] shrink-0 bg-black/30"
        onClick={onClose}
        aria-label="Close email editor"
      />
      <div className="relative flex h-full min-h-0 w-[75%] min-w-[480px] flex-col overflow-hidden rounded-l-[24px] bg-white shadow-[-4px_0_24px_rgba(0,0,0,0.12)]">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border-default px-6 py-4">
          <h2 className="font-sora text-[16px] font-bold text-text-primary">
            {drawerTitleForEmail(draft)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-default bg-white px-3.5 py-1.5 text-[13px] font-medium text-blue-600 transition-colors hover:bg-surface-muted"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="rounded-md bg-blue-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-[640px] space-y-5">
            <FormField label="Email name">
              <Input
                value={draft.title}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </FormField>

            <div className="flex flex-wrap items-center gap-2 text-[14px] text-text-primary">
              <span>Send email</span>
              {draft.timing !== "on-due" ? (
                <input
                  type="number"
                  min={0}
                  value={draft.daysOffset}
                  onChange={(e) => patch({ daysOffset: Number(e.target.value) || 0 })}
                  className="h-8 w-14 rounded-md border border-border-default bg-white px-2 text-center text-[14px] tabular-nums outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              ) : null}
              <span>
                {draft.timing === "on-due"
                  ? timingLabel("on-due")
                  : `${draft.daysOffset} days ${timingLabel(draft.timing)}`}
              </span>
            </div>

            <FormField label="From">
              <Select value={draft.from} onChange={(e) => patch({ from: e.target.value })}>
                <option value={DEFAULT_EMAIL_FROM}>{DEFAULT_EMAIL_FROM}</option>
                <option value="Billing Ops <billing@chargebee.com>">
                  Billing Ops &lt;billing@chargebee.com&gt;
                </option>
              </Select>
            </FormField>

            <div>
              <FormField label="Send to">
                <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-border-default bg-white px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  {draft.sendTo.map((recipient) => (
                    <span
                      key={recipient}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[13px] text-text-primary"
                    >
                      {recipient}
                      <button
                        type="button"
                        onClick={() =>
                          patch({ sendTo: draft.sendTo.filter((r) => r !== recipient) })
                        }
                        className="text-text-muted hover:text-text-primary"
                        aria-label={`Remove ${recipient}`}
                      >
                        <X size={12} aria-hidden />
                      </button>
                    </span>
                  ))}
                </div>
              </FormField>
              <div className="mt-1 flex gap-3">
                <button type="button" className="text-[12px] font-medium text-blue-600 hover:underline">
                  CC
                </button>
                <button type="button" className="text-[12px] font-medium text-blue-600 hover:underline">
                  BCC
                </button>
              </div>
            </div>

            <div>
              <div className="mb-2 flex gap-4 border-b border-border-default">
                {REMINDER_EMAIL_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => patch({ language: lang })}
                    className={cn(
                      "border-b-2 pb-2 text-[13px] font-medium transition-colors",
                      draft.language === lang
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-text-muted hover:text-text-secondary",
                    )}
                  >
                    {lang}
                  </button>
                ))}
                <button
                  type="button"
                  className="border-b-2 border-transparent pb-2 text-[13px] font-medium text-text-muted"
                >
                  More
                </button>
              </div>
              <FormField label="Subject">
                <Input
                  value={draft.subject}
                  onChange={(e) => patch({ subject: e.target.value })}
                />
              </FormField>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={cn("text-[13px] font-medium text-text-secondary")}>Body</span>
                <button
                  type="button"
                  className="text-[12px] font-medium text-blue-600 hover:underline"
                >
                  Use HTML editor
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-border-default bg-gray-50 p-4">
                <div className="rounded-lg border border-border-default bg-white p-5 text-[13px] leading-relaxed text-text-primary shadow-sm">
                  <p className="text-[18px] font-bold">Your payment is due</p>
                  <p className="mt-3">
                    Hey{" "}
                    <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700">
                      [Full Name]
                    </span>
                    ,
                  </p>
                  <p className="mt-2 text-text-secondary">
                    This is a friendly reminder that your invoice is due today. Please complete
                    payment at your earliest convenience.
                  </p>
                  <p className="mt-3">
                    <span className="text-text-muted">Invoiced amount</span>{" "}
                    <strong>$5.00</strong>
                  </p>
                  <p className="mt-1">
                    <span className="text-text-muted">Due Date</span> <strong>14-Feb-2025</strong>
                  </p>
                  <p className="mt-4">Regards,</p>
                  <p className="font-medium">Emma Collins</p>
                  <p className="mt-4 text-blue-600">Login to your account now</p>
                  <div className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-[12px] text-text-muted">
                    PS: We value your experience — reach out if you need help with this invoice.
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-border-default pt-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Advanced Settings</h3>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border-default bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-[14px] font-medium text-text-primary">Attach invoice</p>
                  <p className="mt-0.5 text-[12px] text-text-muted">
                    Attach the invoice PDF to this email
                  </p>
                </div>
                <CompactToggleSwitch
                  checked={draft.attachInvoice}
                  onChange={(attachInvoice) => patch({ attachInvoice })}
                  aria-label="Attach invoice PDF"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
