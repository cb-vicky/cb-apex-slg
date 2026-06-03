import { Check, ChevronDown, ChevronRight, Clock, Pencil, X } from "lucide-react";
import { shortDate, currency, cn } from "@/lib/utils";
import type { PromiseToPayLogEntry, PromiseToPayEntryStatus } from "@/data/billing-data";
import { getPromiseLogNote } from "@/data/billing-data";
import { PROMISE_TO_PAY_AS_OF } from "@/data/billing-data";
import {
  formatDueStatusFromDays,
  ReceivableDueStatusBadge,
} from "./ReceivableDueStatusBadge";

const BADGE_BASE =
  "inline-flex w-fit items-center rounded px-1.5 py-px text-[11px] font-medium leading-tight capitalize";

function formatPromisedFor(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}

const ICON_BADGE =
  "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full";

export function PromiseToPayEntryStatusBadge({ status }: { status: PromiseToPayEntryStatus }) {
  if (status === "scheduled") {
    return (
      <span
        className={cn(ICON_BADGE, "bg-blue-50 text-blue-600 ring-1 ring-blue-200/80")}
        title="Scheduled"
        aria-label="Scheduled"
      >
        <Clock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }

  if (status === "paid") {
    return (
      <span
        className={cn(ICON_BADGE, "bg-emerald-600 text-white")}
        title="Paid"
        aria-label="Paid"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
      </span>
    );
  }

  const styles: Record<Exclude<PromiseToPayEntryStatus, "scheduled" | "paid">, string> = {
    edited: "border border-amber-200 bg-amber-50 text-amber-700",
    failed: "border border-red-200 bg-red-50 text-red-700",
  };

  const labels: Record<Exclude<PromiseToPayEntryStatus, "scheduled" | "paid">, string> = {
    edited: "Edited",
    failed: "Failed",
  };

  return (
    <span className={cn(BADGE_BASE, styles[status])}>{labels[status]}</span>
  );
}

export function PromiseToPayExpandableStatusIndicator({
  status,
  hasLogs,
  isExpanded,
}: {
  status: PromiseToPayEntryStatus;
  hasLogs: boolean;
  isExpanded: boolean;
}) {
  const isIconStatus = status === "scheduled" || status === "paid";
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        isIconStatus && "h-6 w-6",
      )}
      aria-hidden
    >
      <span
        className={cn(
          hasLogs && "transition-opacity duration-150 group-hover:opacity-0",
        )}
      >
        <PromiseToPayEntryStatusBadge status={status} />
      </span>
      {hasLogs ? (
        <span
          className={cn(
            ICON_BADGE,
            "pointer-events-none absolute inset-0 flex items-center justify-center bg-gray-100/95 text-text-primary opacity-0 ring-1 ring-border-default transition-opacity duration-150 group-hover:opacity-100",
          )}
          aria-hidden
        >
          <Chevron className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
      ) : null}
    </span>
  );
}

export function promiseToPayLogEntryLabel(log: PromiseToPayLogEntry): string {
  if (log.status === "paid" && log.paidOn) {
    return `Paid on ${formatPromisedFor(log.paidOn)}`;
  }
  if (log.promisedFor) {
    if (log.status === "failed") {
      return `Missed promise for ${formatPromisedFor(log.promisedFor)}`;
    }
    return `Promised for ${formatPromisedFor(log.promisedFor)}`;
  }
  return "Promise logged";
}

function daysUntilPromised(promisedFor: string, asOf = PROMISE_TO_PAY_AS_OF): number {
  const start = new Date(`${asOf}T00:00:00`);
  const end = new Date(`${promisedFor}T00:00:00`);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function PromiseToPayDueStatusBadge({ promisedFor }: { promisedFor: string }) {
  return (
    <ReceivableDueStatusBadge
      label={formatDueStatusFromDays(daysUntilPromised(promisedFor))}
    />
  );
}

export function PromiseToPayRowPrimaryLine({
  amount,
  log,
}: {
  amount: number;
  log: PromiseToPayLogEntry;
}) {
  const amountLabel = currency(amount);

  if (log.status === "paid" && log.paidOn) {
    return (
      <span className="text-[13px] font-medium text-text-primary">
        Paid{" "}
        <span className="font-extrabold tabular-nums">{amountLabel}</span> on{" "}
        {formatPromisedFor(log.paidOn)}
      </span>
    );
  }

  if (log.promisedFor) {
    const dateLabel = formatPromisedFor(log.promisedFor);
    if (log.status === "failed") {
      return (
        <span className="text-[13px] font-medium text-text-primary">
          Missed promise of{" "}
          <span className="font-extrabold tabular-nums">{amountLabel}</span> for {dateLabel}
        </span>
      );
    }

    if (log.status === "edited") {
      return (
        <span className="text-[13px] font-medium text-text-primary">
          Previously promised{" "}
          <span className="font-extrabold tabular-nums">{amountLabel}</span> for {dateLabel}
        </span>
      );
    }

    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-[13px] font-medium text-text-primary">
        <span>
          Promised <span className="font-extrabold tabular-nums">{amountLabel}</span> for{" "}
          {dateLabel}
        </span>
        {log.status === "scheduled" ? (
          <PromiseToPayDueStatusBadge promisedFor={log.promisedFor} />
        ) : null}
      </span>
    );
  }

  return (
    <span className="text-[13px] font-medium text-text-primary">
      Promised <span className="font-extrabold tabular-nums">{amountLabel}</span>
    </span>
  );
}

export const PROMISE_UPDATE_ACTION_LABEL = "Update promise";

const STEP_DOT: Record<
  PromiseToPayEntryStatus,
  { circle: string; icon: typeof Check; iconClass: string }
> = {
  paid: { circle: "bg-emerald-600", icon: Check, iconClass: "text-white" },
  edited: { circle: "bg-amber-100", icon: Pencil, iconClass: "text-amber-700" },
  failed: { circle: "bg-red-100", icon: X, iconClass: "text-red-600" },
  scheduled: { circle: "bg-blue-50", icon: Clock, iconClass: "text-blue-600" },
};

export function PromiseToPayTimelineStep({
  log,
  amount,
  isLast,
  onEdit,
}: {
  log: PromiseToPayLogEntry;
  amount: number;
  isLast: boolean;
  onEdit?: () => void;
}) {
  const dot = STEP_DOT[log.status];
  const Icon = dot.icon;
  const noteText = getPromiseLogNote(log);

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
          dot.circle,
        )}
      >
        <Icon className={cn("h-4 w-4", dot.iconClass)} strokeWidth={2.5} aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <PromiseToPayRowPrimaryLine amount={amount} log={log} />
          {log.status === "scheduled" && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="text-[12px] font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              {PROMISE_UPDATE_ACTION_LABEL}
            </button>
          ) : null}
        </div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <span className="text-[12px] text-text-secondary">{shortDate(log.loggedOn)}</span>
          <span className="text-[12px] text-text-muted">{log.loggedByName}</span>
        </div>
        {noteText ? (
          <p className="mt-2 rounded-md border border-border-subtle bg-white px-3 py-2 text-[13px] leading-relaxed text-text-secondary">
            {noteText}
          </p>
        ) : null}
      </div>
    </li>
  );
}
