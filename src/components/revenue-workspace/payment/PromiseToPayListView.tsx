import { useState } from "react";
import { cn } from "@/lib/utils";
import type { PromiseToPayRecord } from "@/data/billing-data";
import {
  getPrimaryPromiseToPayLog,
  getPromiseLogAmount,
  isPromiseSettled,
  sortPromiseToPayLogs,
} from "@/data/billing-data";
import { PromiseToPayAssociatedInvoices } from "./PromiseToPayAssociatedInvoices";
import {
  PromiseToPayExpandableStatusIndicator,
  PromiseToPayRowPrimaryLine,
  PromiseToPayTimelineStep,
  PROMISE_UPDATE_ACTION_LABEL,
} from "./promise-to-pay-entry-ui";
import { usePaymentCollectionsChrome } from "./PaymentCollectionsChromeContext";

/** Invoice column grows with badges; promise column absorbs shrink. */
const HEADER_COLS = "grid-cols-[minmax(0,1fr)_auto]";
const LIST_INVOICE_MAX_VISIBLE = 3;

interface Props {
  promises: PromiseToPayRecord[];
  onEditScheduled?: (promiseId: string, logId: string) => void;
  /** Nested inside SectionCard on Collections overview — no duplicate outer card chrome. */
  embedded?: boolean;
}

export function PromiseToPayListView({
  promises,
  onEditScheduled,
  embedded = false,
}: Props) {
  const chrome = usePaymentCollectionsChrome();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (promises.length === 0) {
    if (embedded) return null;
    return (
      <div className="rounded-3xl border border-border-default bg-white px-6 py-12 text-center">
        <p className="text-[13px] text-text-muted">No promise-to-pay records for this customer.</p>
      </div>
    );
  }

  function toggle(promiseId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(promiseId)) next.delete(promiseId);
      else next.add(promiseId);
      return next;
    });
  }

  const list = (
    <>
      <div
        className={cn(
          "grid items-center gap-3 border-b border-border-subtle px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted",
          embedded ? "pt-0" : "pt-4",
          HEADER_COLS,
        )}
      >
        <span>Promise</span>
        <span className="text-right">Invoice</span>
      </div>

      <div className="divide-y divide-border-subtle">
        {promises.map((record) => {
          const isExpanded = expanded.has(record.id);
          const hasLogs = record.logs.length > 0;
          const settled = isPromiseSettled(record);
          const sortedLogs = sortPromiseToPayLogs(record.logs, settled);
          const primaryLog = getPrimaryPromiseToPayLog(record);

          const rowExpandable = hasLogs;

          return (
            <div key={record.id} className="group">
              <div
                role={rowExpandable ? "button" : undefined}
                tabIndex={rowExpandable ? 0 : undefined}
                aria-expanded={rowExpandable ? isExpanded : undefined}
                aria-label={
                  rowExpandable
                    ? isExpanded
                      ? "Collapse promise activity"
                      : "Expand promise activity"
                    : undefined
                }
                onClick={rowExpandable ? () => toggle(record.id) : undefined}
                onKeyDown={
                  rowExpandable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggle(record.id);
                        }
                      }
                    : undefined
                }
                className={cn(
                  "grid items-center gap-3 py-3 pl-4 pr-4 transition-colors hover:bg-surface-muted/60",
                  HEADER_COLS,
                  rowExpandable && "cursor-pointer",
                )}
              >
                <div className="min-w-0">
                  {primaryLog ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <PromiseToPayExpandableStatusIndicator
                        status={primaryLog.status}
                        hasLogs={hasLogs}
                        isExpanded={isExpanded}
                      />
                      <PromiseToPayRowPrimaryLine
                        amount={getPromiseLogAmount(primaryLog, record.amount)}
                        log={primaryLog}
                      />
                      {primaryLog.status === "scheduled" &&
                      onEditScheduled &&
                      !isExpanded ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditScheduled(record.id, primaryLog.id);
                          }}
                          className="text-[12px] font-semibold text-blue-600 opacity-0 transition-opacity hover:text-blue-700 group-hover:opacity-100 focus:opacity-100"
                        >
                          {PROMISE_UPDATE_ACTION_LABEL}
                        </button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[13px] text-text-muted">No promise activity</span>
                  )}
                </div>

                <div className="flex shrink-0 justify-end self-center">
                  <PromiseToPayAssociatedInvoices
                    invoiceIds={record.invoiceIds}
                    maxVisible={LIST_INVOICE_MAX_VISIBLE}
                    onInvoiceClick={(invoiceId) =>
                      chrome?.openInvoiceFromCollectionsFlow(invoiceId)
                    }
                  />
                </div>
              </div>

              {isExpanded && hasLogs && (
                <div className="border-t border-border-subtle bg-gray-50 px-4 py-4 pr-5">
                  <ol className="m-0 list-none p-0">
                    {sortedLogs.map((log, idx) => (
                      <PromiseToPayTimelineStep
                        key={log.id}
                        log={log}
                        amount={getPromiseLogAmount(log, record.amount)}
                        isLast={idx === sortedLogs.length - 1}
                        onEdit={
                          log.status === "scheduled" && onEditScheduled
                            ? () => onEditScheduled(record.id, log.id)
                            : undefined
                        }
                      />
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return <div className="overflow-hidden">{list}</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border-default bg-white">
      {list}
    </div>
  );
}
