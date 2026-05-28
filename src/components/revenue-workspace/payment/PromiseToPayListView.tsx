import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { currency, shortDate, cn } from "@/lib/utils";
import type {
  PromiseToPayInvoiceGroup,
  PromiseToPayLogEntry,
  PromiseToPayLogStatus,
} from "@/data/billing-data";

const GRID_COLS =
  "grid-cols-[auto_minmax(0,1fr)_88px_100px_110px_120px]";

function formatPromisedFor(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}

function StatusBadge({ status }: { status: PromiseToPayLogStatus }) {
  const paid = status === "paid";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium leading-4 capitalize",
        paid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {paid ? "Paid" : "Pending"}
    </span>
  );
}

function LogEntryRow({ log }: { log: PromiseToPayLogEntry }) {
  const paid = log.status === "paid";

  return (
    <div
      className={cn(
        "grid items-center gap-3 border-b border-border-subtle py-2.5 pl-7 pr-4 last:border-0",
        GRID_COLS,
      )}
    >
      <span />
      <div className="min-w-0">
        <p className="text-[13px] font-semibold text-text-primary">{log.headline}</p>
        {!paid && log.promisedFor && (
          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
            Promised for {formatPromisedFor(log.promisedFor)}
          </p>
        )}
      </div>
      <StatusBadge status={log.status} />
      <span className="text-text-muted">—</span>
      <span className="text-[12px] text-text-secondary">{shortDate(log.loggedOn)}</span>
      <span className="truncate text-[12px] text-text-secondary">{log.loggedByName}</span>
    </div>
  );
}

interface Props {
  groups: PromiseToPayInvoiceGroup[];
}

export function PromiseToPayListView({ groups }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border border-border-default bg-white px-6 py-12 text-center">
        <p className="text-[13px] text-text-muted">No promise-to-pay records for this customer.</p>
      </div>
    );
  }

  function toggle(invoiceId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(invoiceId)) next.delete(invoiceId);
      else next.add(invoiceId);
      return next;
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      <div
        className={cn(
          "grid items-center gap-3 border-b border-border-subtle px-4 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
          GRID_COLS,
        )}
      >
        <span className="w-4" />
        <span>Invoice</span>
        <span>Status</span>
        <span className="text-right">Amount</span>
        <span>Logged on</span>
        <span>Logged by</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {groups.map((group) => {
          const isExpanded = expanded.has(group.invoiceId);
          const hasLogs = group.logs.length > 0;

          return (
            <div key={group.invoiceId}>
              <div
                className={cn(
                  "grid items-center gap-3 py-3 pl-3 pr-4 transition-colors hover:bg-surface-muted/60",
                  GRID_COLS,
                )}
              >
                <button
                  type="button"
                  onClick={() => hasLogs && toggle(group.invoiceId)}
                  className={cn(
                    "flex h-5 w-4 items-center justify-center text-text-muted transition-colors",
                    hasLogs ? "cursor-pointer hover:text-text-primary" : "cursor-default",
                  )}
                  aria-expanded={isExpanded}
                  aria-label={isExpanded ? "Collapse activity" : "Expand activity"}
                >
                  {hasLogs ? (
                    isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />
                  ) : null}
                </button>

                <span className="text-[13px] font-semibold text-text-primary">{group.invoiceId}</span>
                <span />
                <span className="text-right text-[13px] font-medium tabular-nums text-text-primary">
                  {currency(group.amount)}
                </span>
                <span />
                <span />
              </div>

              {isExpanded && hasLogs && (
                <div className="border-t border-border-subtle bg-gray-50 pb-1">
                  {[...group.logs].reverse().map((log) => (
                    <LogEntryRow key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
