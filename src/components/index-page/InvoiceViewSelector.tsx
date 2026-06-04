import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  INVOICE_LIST_VIEWS,
  type InvoiceListViewId,
} from "@/data/invoice-list-views";
import { cn } from "@/lib/utils";

interface Props {
  activeViewId: InvoiceListViewId;
  viewCounts: Record<InvoiceListViewId, number>;
  onViewChange: (viewId: InvoiceListViewId) => void;
}

function viewLabel(viewId: InvoiceListViewId): string {
  return INVOICE_LIST_VIEWS.find((v) => v.id === viewId)?.label ?? viewId;
}

export function InvoiceViewSelector({ activeViewId, viewCounts, onViewChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const activeCount = viewCounts[activeViewId] ?? 0;

  return (
    <div ref={rootRef} className="relative w-fit min-w-[200px] max-w-[280px]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Invoice list view"
        className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-[colors,box-shadow] duration-150",
          open
            ? "border-blue-300 bg-white shadow-sm ring-2 ring-blue-100"
            : "border-border-default bg-white hover:border-gray-300 hover:shadow-sm",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-text-primary">
            {viewLabel(activeViewId)}
          </span>
          <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
            {activeCount}
          </span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={cn("shrink-0 text-text-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Invoice list views"
          className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-[min(320px,50vh)] w-full min-w-[260px] overflow-y-auto rounded-xl border border-border-default bg-white py-1 shadow-xl"
        >
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            View
          </p>
          {INVOICE_LIST_VIEWS.map((view) => {
            const selected = view.id === activeViewId;
            const count = viewCounts[view.id] ?? 0;

            return (
              <button
                key={view.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  onViewChange(view.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition-colors",
                  selected
                    ? "bg-blue-50 text-blue-700"
                    : "text-text-primary hover:bg-surface-muted",
                )}
              >
                <span className="min-w-0 truncate font-medium">{view.label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                    selected ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-text-muted",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
