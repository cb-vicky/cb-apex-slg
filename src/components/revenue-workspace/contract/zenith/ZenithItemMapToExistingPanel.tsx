import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, ExternalLink, Search } from "lucide-react";
import { formInputClass } from "@/components/ui/form-field";
import { StatusBadge } from "@/components/ui/primitives";
import {
  filterZenithCatalogItems,
  type ZenithCatalogSiteItem,
} from "@/data/zenith-catalog-items";
import { cn } from "@/lib/utils";

export function CatalogItemActiveTag({ className }: { className?: string }) {
  return <StatusBadge status="Active" className={cn("shrink-0", className)} />;
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

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: amount < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

function MetadataRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,36%)_1fr] gap-2 border-b border-border-subtle px-3 py-2",
        last && "border-b-0",
      )}
    >
      <dt className="text-text-muted">{label}</dt>
      <dd className={cn("text-text-primary", mono && "font-mono text-[11px]")}>{value}</dd>
    </div>
  );
}

export type ZenithCatalogPickFlow = "mapping" | "add-row";

interface Props {
  embedded?: boolean;
  mappedItemId: string | null;
  onMapItem: (catalogItemId: string) => void;
  flow?: ZenithCatalogPickFlow;
}

export function ZenithItemMapToExistingPanel({
  embedded = false,
  mappedItemId,
  onMapItem,
  flow = "mapping",
}: Props) {
  const isAddRow = flow === "add-row";
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const results = useMemo(() => filterZenithCatalogItems(search), [search]);
  const searchQuery = search.trim();
  const resultsLabel = searchQuery
    ? `${results.length} ${results.length === 1 ? "result" : "results"} for "${searchQuery}"`
    : `${results.length} items in your catalog`;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        embedded ? "py-0" : "bg-gray-50/80 px-3 py-3",
      )}
    >
      <p className="text-[12px] text-text-muted">
        {isAddRow
          ? "Search your Chargebee catalog and choose an item to add to this contract."
          : "Search your Chargebee catalog and map to an existing item."}
      </p>

      <label className="flex flex-col gap-1.5">
        <span className="sr-only">Search catalog items</span>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, SKU, or type"
            className={cn(formInputClass, "h-8 pl-9 text-[13px]")}
          />
        </div>
      </label>

      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="font-medium text-text-primary">{resultsLabel}</span>
        <span className="text-text-muted">Expand for details</span>
      </div>

      <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border-default bg-white">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-text-muted">
            No items match your search.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {results.map((item) => (
              <CatalogItemRow
                key={item.id}
                item={item}
                expanded={expandedId === item.id}
                selected={mappedItemId === item.id}
                onToggleExpand={() =>
                  setExpandedId((prev) => (prev === item.id ? null : item.id))
                }
                onMap={() => onMapItem(item.id)}
                flow={flow}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function CatalogItemRow({
  item,
  expanded,
  selected,
  onToggleExpand,
  onMap,
  flow,
}: {
  item: ZenithCatalogSiteItem;
  expanded: boolean;
  selected: boolean;
  onToggleExpand: () => void;
  onMap: () => void;
  flow: ZenithCatalogPickFlow;
}) {
  const isAddRow = flow === "add-row";
  const actionLabel = selected
    ? isAddRow
      ? "Added"
      : "Mapped"
    : isAddRow
      ? "Add to list"
      : "Map this item";
  return (
    <li>
      <button
        type="button"
        onClick={onToggleExpand}
        className={cn(
          "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-muted/60",
          selected && "bg-blue-50/50",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-text-primary">{item.name}</span>
            <CatalogItemActiveTag />
            <CatalogItemExternalLink itemId={item.id} itemName={item.name} />
          </span>
          <span className="block truncate text-[12px] text-text-muted">
            {item.sku} · {item.itemType} · {formatMoney(item.unitPrice, item.currency)}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {expanded ? (
            <ChevronUp size={16} className="text-text-muted" aria-hidden />
          ) : (
            <ChevronDown size={16} className="text-text-muted" aria-hidden />
          )}
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-border-subtle bg-gray-50/80 px-3 pb-3 pt-2">
          <dl className="overflow-hidden rounded-md border border-border-default bg-white text-[12px]">
            <MetadataRow label="SKU" value={item.sku} mono />
            <MetadataRow label="Item type" value={item.itemType} />
            <MetadataRow label="Billing frequency" value={item.billingFrequency} />
            <MetadataRow label="Unit price" value={formatMoney(item.unitPrice, item.currency)} />
            <MetadataRow label="Status" value={item.status} />
            <MetadataRow label="Created" value={item.createdAt} last />
          </dl>
          <p className="mt-2 text-[12px] leading-snug text-text-secondary">{item.description}</p>
          <div className="mt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              View in Chargebee
              <ExternalLink size={12} strokeWidth={2} aria-hidden />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMap();
              }}
              className={cn(
                "inline-flex h-7 items-center gap-1.5 rounded-full border bg-white px-2.5 text-[11px] font-semibold transition-colors",
                selected
                  ? "border-gray-300 text-text-primary shadow-sm"
                  : "border-border-default text-text-secondary hover:border-gray-300 hover:text-text-primary",
              )}
            >
              <Check size={13} strokeWidth={2.5} />
              {actionLabel}
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}
