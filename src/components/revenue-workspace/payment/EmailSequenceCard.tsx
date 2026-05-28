import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollectionEmailSequence, EmailSequenceStep } from "@/data/collections-email-sequence";

function formatSequenceDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function stepStatusLine(step: EmailSequenceStep): string {
  const when = formatSequenceDateTime(step.at);
  return step.status === "sent" ? `Sent on ${when}` : `Scheduled for ${when}`;
}

export function getSequenceMetricValue(sequence: CollectionEmailSequence): string {
  const total = sequence.steps.length;
  const remaining = sequence.steps.filter((s) => s.status === "scheduled").length;
  const emailWord = remaining === 1 ? "email" : "emails";
  return `${remaining} of ${total} ${emailWord} left`;
}

function SequenceStep({
  step,
  isLast,
}: {
  step: EmailSequenceStep;
  isLast: boolean;
}) {
  const sent = step.status === "sent";

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      {!isLast && (
        <span
          className="absolute left-[15px] top-8 bottom-0 w-px bg-border-default"
          aria-hidden
        />
      )}
      <div
        className={cn(
          "relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          sent ? "bg-blue-600" : "bg-gray-100",
        )}
      >
        {sent ? (
          <Check className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden />
        ) : (
          <Clock className="h-4 w-4 text-gray-500" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
          Email {step.step}
        </p>
        <p className="mt-0.5 text-[13px] font-semibold text-text-primary">{step.subject}</p>
        <p className="mt-0.5 text-[12px] text-text-muted">{stepStatusLine(step)}</p>
      </div>
    </li>
  );
}

export function EmailSequencePopoverContent({ sequence }: { sequence: CollectionEmailSequence }) {
  const total = sequence.steps.length;
  const sentCount = sequence.steps.filter((s) => s.status === "sent").length;
  const remaining = total - sentCount;
  const progressPct = total > 0 ? (sentCount / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-border-default bg-white p-4 shadow-lg">
      <p className="font-heading text-[14px] font-bold text-text-primary">{sequence.name}</p>
      <div className="mt-2.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-blue-600 transition-[width]"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-1.5 text-[12px] text-text-muted">
          <span className="font-semibold text-text-primary">{remaining}</span> of{" "}
          <span className="font-semibold text-text-primary">{total}</span> emails left in Sequence
        </p>
      </div>
      <ol className="mt-4 list-none">
        {sequence.steps.map((step, idx) => (
          <SequenceStep
            key={step.step}
            step={step}
            isLast={idx === sequence.steps.length - 1}
          />
        ))}
      </ol>
    </div>
  );
}

export function EmailSequenceMetricTile({
  sequence,
  popoverAlign = "right",
}: {
  sequence: CollectionEmailSequence;
  popoverAlign?: "left" | "right";
}) {
  const value = getSequenceMetricValue(sequence);
  const total = sequence.steps.length;
  const sentCount = sequence.steps.filter((s) => s.status === "sent").length;
  const progressPct = total > 0 ? (sentCount / total) * 100 : 0;

  return (
    <div className="group relative">
      <div
        className="rounded-2xl border border-border-default bg-white px-3 py-2.5 transition-colors group-hover:border-gray-300"
        tabIndex={0}
        role="button"
        aria-haspopup="dialog"
        aria-label={`Sequence: ${value}. Hover for details.`}
      >
        <div className="flex items-center gap-2">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Sequence</p>
          <div
            className="h-1.5 w-[30px] shrink-0 overflow-hidden rounded-full bg-blue-100 transition-[height] duration-200 ease-out group-hover:h-2"
            role="progressbar"
            aria-valuenow={sentCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={`${sentCount} of ${total} emails sent`}
          >
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-200 ease-out group-hover:bg-blue-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <p className="mt-1 text-sm font-semibold leading-snug text-text-primary">{value}</p>
      </div>
      <div
        className={cn(
          "pointer-events-none invisible absolute top-full z-50 w-[min(20rem,calc(100vw-2rem))] pt-2 opacity-0 transition-opacity duration-150",
          "group-hover:visible group-hover:pointer-events-auto group-hover:opacity-100",
          "group-focus-within:visible group-focus-within:pointer-events-auto group-focus-within:opacity-100",
          popoverAlign === "right" ? "right-0 left-auto" : "left-0",
        )}
        role="dialog"
        aria-label={`${sequence.name} email sequence`}
      >
        <EmailSequencePopoverContent sequence={sequence} />
      </div>
    </div>
  );
}
