import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Filter, Search, Sparkles } from "lucide-react";
import { WTable, WTbody, WTd, WTr } from "@/components/ui/data-table";
import { formInputClass } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";
import {
  filterZenithCatalogItems,
  getZenithCatalogItemById,
  type ZenithCatalogSiteItem,
} from "@/data/zenith-catalog-items";
import { cn } from "@/lib/utils";
import {
  applyCatalogColumnFilters,
  catalogBillingCycle,
  catalogPricingModel,
  catalogProductType,
  catalogTaxableLabel,
  catalogTrialLabel,
  emptyCatalogColumnFilters,
  formatCatalogUnitPrice,
  type CatalogColumnFilters,
} from "./zenith-catalog-display";

export function CatalogItemActiveTag({ className }: { className?: string }) {
  return <StatusBadge status="Active" className={cn("shrink-0", className)} />;
}

export function CatalogMatchPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-full border border-border-default bg-white px-1.5 py-px text-[10px] font-medium text-text-muted",
        className,
      )}
    >
      <Sparkles size={10} strokeWidth={2} className="text-blue-600" aria-hidden />
      Match
    </span>
  );
}

export function CatalogItemExternalLink({
  itemId,
  itemName,
  className,
}: {
  itemId: string;
  itemName: string;
  className?: string;
}) {
  return (
    <a
      href={`#items/${itemId}`}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex shrink-0 rounded p-0.5 text-text-muted/80 transition-colors hover:bg-black/[0.04] hover:text-blue-600",
        className,
      )}
      aria-label={`View ${itemName} in Chargebee`}
      title="View in Chargebee"
    >
      <ExternalLink size={12} strokeWidth={2} aria-hidden />
    </a>
  );
}

export type ZenithCatalogPickFlow = "mapping" | "add-row";

type FilterColumnKey = keyof CatalogColumnFilters;

const compactFilterInputClass =
  "h-7 w-full min-w-[120px] rounded border border-border-default bg-white px-2 text-[12px] text-text-primary focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400/30";

function CatalogFilterPopover({
  open,
  anchorRef,
  onClose,
  children,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 4, left: rect.left });
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <>
      <button
        type="button"
        className="fixed inset-0 z-[62] cursor-default bg-transparent"
        aria-label="Close filter"
        onClick={onClose}
      />
      <div
        className="fixed z-[63] min-w-[140px] rounded-md border border-border-default bg-white p-1.5 shadow-lg"
        style={{ top: pos.top, left: pos.left }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

function CatalogColumnFilterHeader({
  label,
  filterKey,
  active,
  open,
  onToggle,
  onClose,
  children,
  className,
  showFilter = true,
}: {
  label: string;
  filterKey?: FilterColumnKey;
  active?: boolean;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
  showFilter?: boolean;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <th className={cn("px-2 py-1.5 text-left font-normal", className)}>
      <div className="inline-flex items-center gap-0.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {label}
        </span>
        {showFilter && filterKey ? (
          <button
            ref={buttonRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className={cn(
              "rounded p-0.5 transition-colors",
              active
                ? "text-blue-600 hover:bg-blue-50"
                : "text-text-muted hover:bg-gray-100 hover:text-text-primary",
            )}
            aria-label={`Filter ${label}`}
            aria-expanded={open}
          >
            <Filter size={11} strokeWidth={2.25} aria-hidden />
          </button>
        ) : null}
      </div>
      {showFilter && filterKey ? (
        <CatalogFilterPopover open={open} anchorRef={buttonRef} onClose={onClose}>
          {children}
        </CatalogFilterPopover>
      ) : null}
    </th>
  );
}

function CatalogFilterOptionList({
  value,
  options,
  onChange,
  onClose,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <li key={opt.value || "__all__"}>
            <button
              type="button"
              className={cn(
                "w-full rounded px-2 py-1.5 text-left text-[12px] transition-colors",
                selected
                  ? "bg-blue-50 font-medium text-blue-700"
                  : "text-text-primary hover:bg-gray-50",
              )}
              onClick={() => {
                onChange(opt.value);
                onClose();
              }}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

interface TableProps {
  items: ZenithCatalogSiteItem[];
  selectedItemId: string | null;
  onSelectItem: (catalogItemId: string) => void;
  flow: ZenithCatalogPickFlow;
  columnFilters: CatalogColumnFilters;
  onColumnFiltersChange: (filters: CatalogColumnFilters) => void;
  /** Rejected system match — show Match pill on this catalog row. */
  highlightMatchCatalogItemId?: string | null;
}

function CatalogItemTable({
  items,
  selectedItemId,
  onSelectItem,
  flow,
  columnFilters,
  onColumnFiltersChange,
  highlightMatchCatalogItemId = null,
}: TableProps) {
  const radioName = flow === "add-row" ? "catalog-add-row-select" : "catalog-map-select";
  const [openFilterKey, setOpenFilterKey] = useState<FilterColumnKey | null>(null);

  const setFilter = (key: FilterColumnKey, value: string) => {
    onColumnFiltersChange({ ...columnFilters, [key]: value });
  };

  const closeFilter = () => setOpenFilterKey(null);
  const toggleFilter = (key: FilterColumnKey) => {
    setOpenFilterKey((prev) => (prev === key ? null : key));
  };

  useEffect(() => {
    if (!openFilterKey) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeFilter();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [openFilterKey]);

  const allOption = { value: "", label: "All" };

  const filterHeaders: {
    key: FilterColumnKey;
    label: string;
    active: boolean;
    content: ReactNode;
  }[] = useMemo(
    () => [
      {
        key: "item",
        label: "Item",
        active: columnFilters.item.trim() !== "",
        content: (
          <input
            type="text"
            value={columnFilters.item}
            onChange={(e) => setFilter("item", e.target.value)}
            placeholder="Name or SKU"
            aria-label="Filter by item name or SKU"
            className={compactFilterInputClass}
            autoFocus
          />
        ),
      },
      {
        key: "itemType",
        label: "Item type",
        active: columnFilters.itemType !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.itemType}
            onChange={(v) => setFilter("itemType", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Plan", label: "Plan" },
              { value: "Addon", label: "Addon" },
              { value: "Charge", label: "Charge" },
            ]}
          />
        ),
      },
      {
        key: "status",
        label: "Status",
        active: columnFilters.status !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.status}
            onChange={(v) => setFilter("status", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Active", label: "Active" },
              { value: "Archived", label: "Archived" },
            ]}
          />
        ),
      },
      {
        key: "frequency",
        label: "Frequency",
        active: columnFilters.frequency !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.frequency}
            onChange={(v) => setFilter("frequency", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Yearly", label: "Yearly" },
              { value: "Monthly", label: "Monthly" },
              { value: "One-time", label: "One-time" },
            ]}
          />
        ),
      },
      {
        key: "pricingModel",
        label: "Pricing model",
        active: columnFilters.pricingModel !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.pricingModel}
            onChange={(v) => setFilter("pricingModel", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Flat fee", label: "Flat fee" },
              { value: "Per unit", label: "Per unit" },
            ]}
          />
        ),
      },
      {
        key: "unitPrice",
        label: "Unit price",
        active: columnFilters.unitPrice.trim() !== "",
        content: (
          <input
            type="text"
            value={columnFilters.unitPrice}
            onChange={(e) => setFilter("unitPrice", e.target.value)}
            placeholder="e.g. 1200"
            aria-label="Filter by unit price"
            className={compactFilterInputClass}
            autoFocus
          />
        ),
      },
      {
        key: "billingCycle",
        label: "Billing cycle",
        active: columnFilters.billingCycle !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.billingCycle}
            onChange={(v) => setFilter("billingCycle", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Forever", label: "Forever" },
              { value: "Fixed", label: "Fixed" },
            ]}
          />
        ),
      },
      {
        key: "trial",
        label: "Trial",
        active: columnFilters.trial !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.trial}
            onChange={(v) => setFilter("trial", v)}
            onClose={closeFilter}
            options={[allOption, { value: "No trial", label: "No trial" }]}
          />
        ),
      },
      {
        key: "taxable",
        label: "Taxable",
        active: columnFilters.taxable !== "",
        content: (
          <CatalogFilterOptionList
            value={columnFilters.taxable}
            onChange={(v) => setFilter("taxable", v)}
            onClose={closeFilter}
            options={[
              allOption,
              { value: "Yes", label: "Yes" },
              { value: "No", label: "No" },
            ]}
          />
        ),
      },
    ],
    [columnFilters],
  );

  return (
    <div className="rounded-lg border border-border-default bg-white">
      <div className="overflow-x-auto">
        <WTable className="min-w-[1140px] text-[12px]">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-border-subtle bg-gray-50">
                <th className="w-8 px-1.5 py-1.5 text-left">
                  <span className="sr-only">Select</span>
                </th>
                {filterHeaders.map(({ key, label, active, content }) => (
                  <CatalogColumnFilterHeader
                    key={key}
                    label={label}
                    filterKey={key}
                    active={active}
                    open={openFilterKey === key}
                    onToggle={() => toggleFilter(key)}
                    onClose={closeFilter}
                  >
                    {content}
                  </CatalogColumnFilterHeader>
                ))}
              </tr>
            </thead>
            <WTbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-4 text-center text-[12px] text-text-muted"
                  >
                    No items match your search or filters.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const selected = selectedItemId === item.id;
                  const showMatchPill = highlightMatchCatalogItemId === item.id;

                  return (
                    <WTr
                      key={item.id}
                      className={cn(
                        "group cursor-pointer",
                        selected && "bg-blue-50/60 hover:bg-blue-50/70",
                      )}
                      onClick={() => onSelectItem(item.id)}
                    >
                      <WTd align="center" className="w-8 px-1.5 py-1.5">
                        <input
                          type="radio"
                          name={radioName}
                          checked={selected}
                          onChange={() => onSelectItem(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-3 w-3 accent-blue-600"
                          aria-label={`Select ${item.name}`}
                        />
                      </WTd>
                      <WTd className="px-2 py-1.5">
                        <div className="flex min-w-[140px] flex-wrap items-center gap-x-1 gap-y-0.5">
                          <span className="truncate font-medium text-text-primary">{item.name}</span>
                          {showMatchPill ? <CatalogMatchPill /> : null}
                          <span className="shrink-0 text-text-muted">·</span>
                          <span className="truncate text-[11px] text-text-muted">{item.sku}</span>
                          <ExternalLink
                            size={12}
                            strokeWidth={2}
                            className="ml-0.5 shrink-0 text-text-muted opacity-0 transition-opacity group-hover:opacity-100"
                            aria-hidden
                          />
                        </div>
                      </WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{catalogProductType(item)}</WTd>
                      <WTd className="px-2 py-1.5">
                        <StatusBadge status={item.status} className="py-px text-[11px]" />
                      </WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{item.billingFrequency}</WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{catalogPricingModel(item)}</WTd>
                      <WTd className="px-2 py-1.5 tabular-nums text-text-secondary">
                        {formatCatalogUnitPrice(item)}
                      </WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{catalogBillingCycle(item)}</WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{catalogTrialLabel(item)}</WTd>
                      <WTd className="px-2 py-1.5 text-text-secondary">{catalogTaxableLabel(item)}</WTd>
                    </WTr>
                  );
                })
              )}
            </WTbody>
          </WTable>
      </div>
    </div>
  );
}

interface Props {
  embedded?: boolean;
  selectedItemId?: string | null;
  selectedItemName?: string;
  onSelectItem?: (catalogItemId: string | null) => void;
  /** Called when the user confirms mapping (not on row select). */
  onMapItem?: (catalogItemId: string) => void;
  flow?: ZenithCatalogPickFlow;
  /** Rejected system match — show Match pill on this catalog row. */
  highlightMatchCatalogItemId?: string | null;
}

export function ZenithItemMapToExistingPanel({
  embedded = false,
  selectedItemId: selectedItemIdProp,
  selectedItemName,
  onSelectItem: onSelectItemProp,
  flow = "mapping",
  highlightMatchCatalogItemId = null,
}: Props) {
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const selectedItemId = selectedItemIdProp ?? internalSelectedId;

  const handleSelectItem = (catalogItemId: string) => {
    if (onSelectItemProp) {
      onSelectItemProp(catalogItemId);
    } else {
      setInternalSelectedId(catalogItemId);
    }
  };

  const handleClearSelection = () => {
    if (onSelectItemProp) {
      onSelectItemProp(null);
    } else {
      setInternalSelectedId(null);
    }
  };

  const [search, setSearch] = useState("");
  const [columnFilters, setColumnFilters] = useState<CatalogColumnFilters>(emptyCatalogColumnFilters);

  const searchResults = useMemo(() => filterZenithCatalogItems(search), [search]);
  const results = useMemo(
    () => applyCatalogColumnFilters(searchResults, columnFilters),
    [searchResults, columnFilters],
  );

  const selectedItem = useMemo(
    () => (selectedItemId ? getZenithCatalogItemById(selectedItemId) : undefined),
    [selectedItemId],
  );
  const resolvedSelectedName = selectedItem?.name ?? selectedItemName ?? "";

  const searchQuery = search.trim();
  const hasColumnFilters = Object.values(columnFilters).some((v) => v.trim() !== "");
  const resultsLabel = searchQuery
    ? `${results.length} ${results.length === 1 ? "result" : "results"} for "${searchQuery}"`
    : hasColumnFilters
      ? `${results.length} filtered ${results.length === 1 ? "item" : "items"}`
      : `${results.length} items in your catalog`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        embedded ? "py-0" : "bg-gray-50/80 px-3 py-3",
      )}
    >
      <div className="flex items-center gap-4">
        <label className="w-[60%] shrink-0">
          <span className="sr-only">Search catalog items</span>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or type"
              className={cn(formInputClass, "h-8 w-full pl-8 text-[12px]")}
            />
          </div>
        </label>

        {selectedItemId && resolvedSelectedName ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 text-[12px]">
            <span className="font-medium text-text-primary">{resolvedSelectedName} selected</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-[12px] font-medium text-text-primary">{resultsLabel}</div>
        )}
      </div>

      <CatalogItemTable
        items={results}
        selectedItemId={selectedItemId}
        onSelectItem={handleSelectItem}
        flow={flow}
        columnFilters={columnFilters}
        onColumnFiltersChange={setColumnFilters}
        highlightMatchCatalogItemId={highlightMatchCatalogItemId}
      />
    </div>
  );
}
