import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  CUSTOMER_LIST_VIEWS,
  DEFAULT_CUSTOMER_LIST_VIEW_ID,
  type CustomerListViewId,
} from "@/data/customer-list-views";
import { cn } from "@/lib/utils";

interface Props {
  activeViewId: CustomerListViewId;
  viewCounts: Record<CustomerListViewId, number>;
  onViewChange: (viewId: CustomerListViewId) => void;
}

function viewLabel(viewId: CustomerListViewId): string {
  return CUSTOMER_LIST_VIEWS.find((v) => v.id === viewId)?.label ?? viewId;
}

export function CustomerViewSelector({ activeViewId, viewCounts, onViewChange }: Props) {
  const [openTabIds, setOpenTabIds] = useState<CustomerListViewId[]>([
    DEFAULT_CUSTOMER_LIST_VIEW_ID,
  ]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const availableToAdd = useMemo(
    () => CUSTOMER_LIST_VIEWS.filter((v) => !openTabIds.includes(v.id)),
    [openTabIds],
  );

  useEffect(() => {
    if (!openTabIds.includes(activeViewId)) {
      onViewChange(openTabIds[0] ?? DEFAULT_CUSTOMER_LIST_VIEW_ID);
    }
  }, [openTabIds, activeViewId, onViewChange]);

  useEffect(() => {
    if (!addMenuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [addMenuOpen]);

  function selectTab(viewId: CustomerListViewId) {
    onViewChange(viewId);
  }

  function addTab(viewId: CustomerListViewId) {
    setOpenTabIds((prev) => (prev.includes(viewId) ? prev : [...prev, viewId]));
    onViewChange(viewId);
    setAddMenuOpen(false);
  }

  function removeTab(viewId: CustomerListViewId) {
    if (openTabIds.length <= 1) return;
    const nextTabs = openTabIds.filter((id) => id !== viewId);
    setOpenTabIds(nextTabs);
    if (activeViewId === viewId) {
      onViewChange(nextTabs[0]!);
    }
  }

  return (
    <div ref={rootRef} className="w-full">
      <div
        role="tablist"
        aria-label="Customer list views"
        className="flex flex-wrap items-center gap-2"
      >
        {openTabIds.map((viewId) => {
          const active = viewId === activeViewId;
          const canClose = openTabIds.length > 1;
          const count = viewCounts[viewId] ?? 0;

          return (
            <div
              key={viewId}
              className={cn(
                "inline-flex items-center rounded-lg border transition-[colors,box-shadow] duration-150",
                active
                  ? "border-blue-300 bg-white shadow-sm ring-2 ring-blue-100"
                  : "border-border-default bg-white hover:border-gray-300 hover:shadow-sm",
              )}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => selectTab(viewId)}
                className={cn(
                  "inline-flex items-center gap-2 py-2 text-[13px] font-medium transition-colors",
                  canClose ? "pl-3 pr-1" : "px-3",
                  active ? "text-blue-600" : "text-text-secondary hover:text-text-primary",
                )}
              >
                <span>{viewLabel(viewId)}</span>
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-md px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
                    active ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-text-muted",
                  )}
                >
                  {count}
                </span>
              </button>
              {canClose ? (
                <button
                  type="button"
                  onClick={() => removeTab(viewId)}
                  aria-label={`Close ${viewLabel(viewId)} view`}
                  className={cn(
                    "mr-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors",
                    active
                      ? "text-blue-600/60 hover:bg-blue-50 hover:text-blue-800"
                      : "text-text-muted hover:bg-gray-100 hover:text-text-primary",
                  )}
                >
                  <X size={12} strokeWidth={2.25} aria-hidden />
                </button>
              ) : null}
            </div>
          );
        })}

        {availableToAdd.length > 0 ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setAddMenuOpen((prev) => !prev)}
              aria-expanded={addMenuOpen}
              aria-haspopup="listbox"
              aria-label="Add view"
              className={cn(
                "inline-flex h-[38px] w-[38px] items-center justify-center rounded-lg border transition-colors",
                addMenuOpen
                  ? "border-blue-300 bg-blue-50 text-blue-600 shadow-sm"
                  : "border-dashed border-border-default bg-white text-text-muted hover:border-gray-300 hover:bg-gray-50 hover:text-text-primary",
              )}
            >
              <Plus size={16} strokeWidth={2.25} aria-hidden />
            </button>

            {addMenuOpen && (
              <div
                role="listbox"
                aria-label="Add view"
                className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-[min(320px,50vh)] w-[260px] overflow-y-auto rounded-xl border border-border-default bg-white py-1 shadow-xl"
              >
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                  Add view
                </p>
                {availableToAdd.map((view) => (
                  <button
                    key={view.id}
                    type="button"
                    role="option"
                    onClick={() => addTab(view.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
                  >
                    <span className="min-w-0 truncate">{view.label}</span>
                    <span className="shrink-0 rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
                      {viewCounts[view.id] ?? 0}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
