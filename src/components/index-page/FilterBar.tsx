import { useState } from "react";
import { X, Plus, Filter, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterTag {
  id: string;
  field: string;
  value: string;
}

export interface FilterOption {
  field: string;
  label: string;
  values: string[];
}

interface FilterBarProps {
  filters: FilterTag[];
  onFiltersChange: (filters: FilterTag[]) => void;
  filterOptions: FilterOption[];
  resultCount?: number;
  resultLabel?: string;
}

export function FilterBar({
  filters,
  onFiltersChange,
  filterOptions,
  resultCount,
  resultLabel = "results",
}: FilterBarProps) {
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);

  function removeFilter(id: string) {
    onFiltersChange(filters.filter((f) => f.id !== id));
  }

  function addFilter(field: string, value: string) {
    const id = `${field}-${value}-${Date.now()}`;
    onFiltersChange([...filters, { id, field, value }]);
    setAddMenuOpen(false);
    setActiveField(null);
  }

  const activeOption = filterOptions.find((o) => o.field === activeField);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {filters.length > 0 && (
          <>
            {filters.map((filter) => (
              <span
                key={filter.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-white py-1 pl-3 pr-1.5 text-[12px] font-medium text-text-primary"
              >
                <span className="text-text-muted">{filter.field}:</span>
                <span>{filter.value}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </span>
            ))}
          </>
        )}

        {/* Add filter button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAddMenuOpen(!addMenuOpen);
              setActiveField(null);
            }}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-dashed px-3 py-1 text-[12px] font-medium transition-colors",
              addMenuOpen
                ? "border-blue-300 bg-blue-50 text-blue-600"
                : "border-border-default text-text-muted hover:border-gray-300 hover:text-text-secondary",
            )}
          >
            {filters.length === 0 && <Filter size={12} strokeWidth={2} />}
            <Plus size={12} strokeWidth={2} />
            <span>Filter</span>
          </button>

          {/* Dropdown menu */}
          {addMenuOpen && (
            <div className="absolute left-0 top-full z-20 mt-1.5 min-w-[180px] rounded-lg border border-border-default bg-white py-1 shadow-lg">
              {!activeField ? (
                <>
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Filter by
                  </p>
                  {filterOptions.map((opt) => (
                    <button
                      key={opt.field}
                      type="button"
                      onClick={() => setActiveField(opt.field)}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
                    >
                      {opt.label}
                      <ChevronDown size={12} className="-rotate-90 text-text-muted" />
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveField(null)}
                    className="flex w-full items-center gap-1.5 border-b border-border-subtle px-3 py-1.5 text-left text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                  >
                    <ChevronDown size={12} className="rotate-90" />
                    {activeOption?.label}
                  </button>
                  {activeOption?.values.map((val) => {
                    const alreadyAdded = filters.some(
                      (f) => f.field === activeField && f.value === val,
                    );
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addFilter(activeField, val)}
                        className={cn(
                          "flex w-full items-center px-3 py-1.5 text-left text-[13px] transition-colors",
                          alreadyAdded
                            ? "cursor-not-allowed text-text-muted"
                            : "text-text-primary hover:bg-surface-muted",
                        )}
                      >
                        {val}
                        {alreadyAdded && (
                          <span className="ml-auto text-[11px] text-text-muted">Added</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Click outside to close */}
        {addMenuOpen && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setAddMenuOpen(false);
              setActiveField(null);
            }}
          />
        )}
      </div>

      {/* Result count */}
      {resultCount !== undefined && (
        <span className="shrink-0 text-[13px] tabular-nums text-text-muted">
          {resultCount} {resultLabel}
        </span>
      )}
    </div>
  );
}
