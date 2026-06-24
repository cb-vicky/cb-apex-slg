import { useState, type ReactNode } from "react";
import { X, Plus, Filter, ChevronDown } from "lucide-react";
import {
  operatorRequiresValue,
  type FilterPropertyDef,
} from "@/data/filter-properties";
import { cn } from "@/lib/utils";

export interface FilterTag {
  id: string;
  field: string;
  value: string;
  operator?: string;
}

export interface FilterOption {
  field: string;
  label: string;
  values: string[];
}

type AddFilterStep = "property" | "operator" | "value";

interface FilterBarProps {
  filters: FilterTag[];
  onFiltersChange: (filters: FilterTag[]) => void;
  filterOptions?: FilterOption[];
  filterProperties?: FilterPropertyDef[];
  resultCount?: number;
  resultLabel?: string;
  leadingContent?: ReactNode;
}

export function FilterBar({
  filters,
  onFiltersChange,
  filterOptions = [],
  filterProperties,
  resultCount,
  resultLabel = "results",
  leadingContent,
}: FilterBarProps) {
  const richMode = (filterProperties?.length ?? 0) > 0;

  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [addStep, setAddStep] = useState<AddFilterStep>("property");
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [activeOperator, setActiveOperator] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState("");

  function closeMenu() {
    setAddMenuOpen(false);
    setActiveField(null);
    setAddStep("property");
    setActiveProperty(null);
    setActiveOperator(null);
    setCustomValue("");
  }

  function removeFilter(id: string) {
    onFiltersChange(filters.filter((f) => f.id !== id));
  }

  function addFilter(field: string, value: string, operator?: string) {
    const id = `${field}-${operator ?? "is"}-${value}-${Date.now()}`;
    onFiltersChange([...filters, { id, field, value, operator }]);
    closeMenu();
  }

  function selectOperator(operator: string) {
    setActiveOperator(operator);
    if (!operatorRequiresValue(operator)) {
      addFilter(activeProperty!, "", operator);
      return;
    }
    setAddStep("value");
    setCustomValue("");
  }

  const activeOption = filterOptions.find((o) => o.field === activeField);
  const propertyDef = activeProperty
    ? filterProperties?.find((p) => p.name === activeProperty)
    : undefined;

  const menuWide = richMode && (addStep === "operator" || addStep === "value");

  const filterControls = (
    <div className="flex flex-wrap items-center gap-2">
      {filters.length > 0 &&
        filters.map((filter) => (
          <span
            key={filter.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-white/50 py-1 pl-3 pr-1.5 text-[12px] font-medium text-text-primary"
          >
                <span className="text-text-muted">{filter.field}</span>
                {filter.operator ? (
                  <>
                    <span className="text-text-secondary">{filter.operator}</span>
                    <span>{filter.value || "—"}</span>
                  </>
                ) : (
                  <>
                    <span className="text-text-muted">:</span>
                    <span>{filter.value}</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => removeFilter(filter.id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
                >
                  <X size={12} strokeWidth={2} />
                </button>
              </span>
            ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (addMenuOpen) {
                  closeMenu();
                } else {
                  setAddMenuOpen(true);
                  setAddStep("property");
                  setActiveProperty(null);
                  setActiveOperator(null);
                  setActiveField(null);
                }
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

            {addMenuOpen && (
              <div
                className={cn(
                  "absolute left-0 top-full z-20 mt-1.5 rounded-lg border border-border-default bg-white py-1 shadow-lg",
                  menuWide ? "w-[min(100vw-2rem,360px)]" : "min-w-[200px]",
                )}
              >
                {richMode ? (
                  <>
                    {addStep === "property" && (
                      <>
                        <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Filter by
                        </p>
                        <div className="max-h-[280px] overflow-y-auto">
                          {filterProperties!.map((property) => (
                            <button
                              key={property.name}
                              type="button"
                              onClick={() => {
                                setActiveProperty(property.name);
                                setAddStep("operator");
                              }}
                              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
                            >
                              {property.name}
                              <ChevronDown size={12} className="-rotate-90 text-text-muted" />
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {addStep === "operator" && propertyDef && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAddStep("property");
                            setActiveProperty(null);
                          }}
                          className="flex w-full items-center gap-1.5 border-b border-border-subtle px-3 py-1.5 text-left text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                        >
                          <ChevronDown size={12} className="rotate-90" />
                          {propertyDef.name}
                        </button>
                        <FilterPropertyHint propertyDef={propertyDef} />
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Operator
                        </p>
                        {propertyDef.operators.map((operator) => (
                          <button
                            key={operator}
                            type="button"
                            onClick={() => selectOperator(operator)}
                            className="flex w-full items-center px-3 py-1.5 text-left text-[13px] text-text-primary transition-colors hover:bg-surface-muted"
                          >
                            {operator}
                          </button>
                        ))}
                      </>
                    )}

                    {addStep === "value" && propertyDef && activeOperator && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setAddStep("operator");
                            setActiveOperator(null);
                            setCustomValue("");
                          }}
                          className="flex w-full items-center gap-1.5 border-b border-border-subtle px-3 py-1.5 text-left text-[12px] font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                        >
                          <ChevronDown size={12} className="rotate-90" />
                          {propertyDef.name} · {activeOperator}
                        </button>
                        <FilterPropertyHint propertyDef={propertyDef} />
                        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Value
                        </p>
                        {propertyDef.valueOptions && propertyDef.valueOptions.length > 0 ? (
                          <div className="max-h-[200px] overflow-y-auto">
                            {propertyDef.valueOptions.map((val) => {
                              const alreadyAdded = filters.some(
                                (f) =>
                                  f.field === activeProperty &&
                                  f.operator === activeOperator &&
                                  f.value === val,
                              );
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  disabled={alreadyAdded}
                                  onClick={() =>
                                    addFilter(activeProperty!, val, activeOperator)
                                  }
                                  className={cn(
                                    "flex w-full items-center px-3 py-1.5 text-left text-[13px] transition-colors",
                                    alreadyAdded
                                      ? "cursor-not-allowed text-text-muted"
                                      : "text-text-primary hover:bg-surface-muted",
                                  )}
                                >
                                  {val}
                                  {alreadyAdded && (
                                    <span className="ml-auto text-[11px] text-text-muted">
                                      Added
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                        <div className="border-t border-border-subtle px-3 py-2">
                          <input
                            type="text"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && customValue.trim()) {
                                addFilter(activeProperty!, customValue.trim(), activeOperator);
                              }
                            }}
                            placeholder={`e.g. ${propertyDef.sampleValues}`}
                            className="w-full rounded-md border border-border-default px-2.5 py-1.5 text-[13px] text-text-primary outline-none ring-blue-200 focus:ring-2"
                          />
                          <button
                            type="button"
                            disabled={!customValue.trim()}
                            onClick={() =>
                              addFilter(activeProperty!, customValue.trim(), activeOperator)
                            }
                            className="mt-2 w-full rounded-md bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Apply filter
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : !activeField ? (
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

            {addMenuOpen && <div className="fixed inset-0 z-10" onClick={closeMenu} />}
          </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex justify-between gap-4",
        leadingContent ? "items-start" : "items-center",
      )}
    >
      {leadingContent ? (
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="w-full min-w-0">{leadingContent}</div>
          {filterControls}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1">{filterControls}</div>
      )}

      {resultCount !== undefined && (
        <span className="shrink-0 text-[13px] tabular-nums text-text-muted">
          {resultCount} {resultLabel}
        </span>
      )}
    </div>
  );
}

function FilterPropertyHint({ propertyDef }: { propertyDef: FilterPropertyDef }) {
  return (
    <div className="border-b border-border-subtle bg-gray-50/80 px-3 py-2">
      <p className="text-[11px] leading-snug text-text-muted">
        <span className="font-medium text-text-secondary">Sample values:</span>{" "}
        {propertyDef.sampleValues}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-text-muted">
        <span className="font-medium text-text-secondary">Operators:</span>{" "}
        {propertyDef.operators.join(", ")}
      </p>
    </div>
  );
}
