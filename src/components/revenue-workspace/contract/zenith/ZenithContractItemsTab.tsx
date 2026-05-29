import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import { getMainScrollContainer } from "./zenith-contract-scroll";
import { CircleCheck, Info, ChevronDown, MoreVertical, Plus } from "lucide-react";
import { getZenithCatalogItemById, type ZenithCatalogSiteItem } from "@/data/zenith-catalog-items";
import {
  zenithSummaryLineItems,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { cn } from "@/lib/utils";
import {
  ZenithItemCreateNewPanel,
  type ZenithCreateItemPayload,
} from "./ZenithItemCreateNewPanel";
import {
  CatalogItemActiveTag,
  CatalogItemExternalLink,
  ZenithItemMapToExistingPanel,
} from "./ZenithItemMapToExistingPanel";

type MappedPanelMode = "match" | "map" | "create";
type ZenithLineItemFlow = "mapping" | "add-row";

const SUCCESS_MESSAGE_AUTO_CLOSE_MS = 3500;

export type LineItemResolutionDetail = {
  kind: "mapped" | "created" | "approved";
  itemName: string;
};

/** Default catalog match for pre-matched contract line items (e.g. Growth CRM). */
const DEFAULT_MATCHED_CATALOG_ITEM_ID = "item-growth-crm";

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function lineItemFromCatalog(
  line: ZenithSummaryLineItem,
  catalog: ZenithCatalogSiteItem,
): ZenithSummaryLineItem {
  const quantity = line.quantity || 1;
  const unitPrice = catalog.unitPrice;
  return {
    ...line,
    name: catalog.name,
    frequency: catalog.billingFrequency,
    unitPrice,
    totalPrice: quantity * unitPrice,
    mappingStatus: "mapped",
  };
}

function lineItemFromCreatePayload(
  line: ZenithSummaryLineItem,
  payload: ZenithCreateItemPayload,
): ZenithSummaryLineItem {
  const quantity = line.quantity || 1;
  return {
    ...line,
    name: payload.name,
    frequency: payload.billingFrequency,
    unitPrice: payload.unitPrice,
    totalPrice: quantity * payload.unitPrice,
    mappingStatus: "mapped",
  };
}

function createDraftLineItem(id: string): ZenithSummaryLineItem {
  return {
    id,
    name: "",
    frequency: "",
    quantity: 0,
    unitPrice: 0,
    totalPrice: 0,
    mappingStatus: "needs_mapping",
  };
}

const EMPTY_ROW_PLACEHOLDER = "-";

function formatLineItemCellText(value: string, showPlaceholder: boolean): string {
  if (showPlaceholder) return EMPTY_ROW_PLACEHOLDER;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : EMPTY_ROW_PLACEHOLDER;
}

function formatLineItemQuantity(quantity: number, showPlaceholder: boolean): string {
  if (showPlaceholder || quantity <= 0) return showPlaceholder ? EMPTY_ROW_PLACEHOLDER : String(quantity);
  return String(quantity);
}

function formatLineItemMoney(amount: number, showPlaceholder: boolean): string {
  if (showPlaceholder) return EMPTY_ROW_PLACEHOLDER;
  return formatMoney(amount);
}

function formatMatchUnitPrice(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const thClass =
  "border-b border-r border-border-subtle bg-gray-50 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-muted last:border-r-0";
const tdClass = "border-b border-r border-border-subtle p-0 align-middle last:border-r-0";

type ExpandedSurfaceTone = "work" | "match" | "resolved";

const EXPANDED_SURFACE: Record<ExpandedSurfaceTone, { row: string; divider: string }> = {
  work: {
    row: "bg-blue-50/60",
    divider: "border-blue-100/80",
  },
  match: {
    row: "bg-emerald-50/65",
    divider: "border-emerald-100/80",
  },
  resolved: {
    row: "bg-emerald-50/65",
    divider: "border-emerald-100/80",
  },
};

function getExpandedSurfaceTone(
  needsMapping: boolean,
  panelMode: MappedPanelMode,
  resolved: boolean,
): ExpandedSurfaceTone {
  if (resolved) return "resolved";
  if (!needsMapping && panelMode === "match") return "match";
  return "work";
}

function editableCellClass(inFocusedRow = false) {
  return cn(
    "flex h-9 w-full min-w-0 items-center px-3 text-[13px] text-text-primary outline-none transition-colors focus:ring-2 focus:ring-inset focus:ring-blue-100",
    inFocusedRow
      ? "bg-transparent hover:bg-black/[0.04] focus:bg-transparent"
      : "bg-white hover:bg-gray-50/50 focus:bg-white",
  );
}

function StatusIconWithTooltip({
  tooltip,
  children,
}: {
  tooltip: string;
  children: ReactNode;
}) {
  return (
    <span className="group/map-icon relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute top-1/2 left-full z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] font-medium leading-snug text-white opacity-0 shadow-md transition-opacity",
          "group-hover/map-icon:opacity-100",
        )}
      >
        {tooltip}
      </span>
    </span>
  );
}

function MappedStatusIcon({ onClick }: { onClick: () => void }) {
  return (
    <StatusIconWithTooltip tooltip="Match found in your site">
      <button
        type="button"
        onClick={onClick}
        aria-label="Toggle matched item details"
        className="rounded p-0.5 text-emerald-600 transition-colors hover:bg-emerald-50"
      >
        <Info size={14} strokeWidth={2.25} className="shrink-0" aria-hidden />
      </button>
    </StatusIconWithTooltip>
  );
}

function UnmappedStatusIcon({ onClick }: { onClick: () => void }) {
  return (
    <StatusIconWithTooltip tooltip="No match found - needs mapping">
      <button
        type="button"
        onClick={onClick}
        aria-label="Open mapping options"
        className="rounded p-0.5 text-red-600 transition-colors hover:bg-red-50"
      >
        <Info size={14} strokeWidth={2.25} className="shrink-0" aria-hidden />
      </button>
    </StatusIconWithTooltip>
  );
}

function ResolvedStatusIcon({
  resolution,
  flow = "mapping",
}: {
  resolution: LineItemResolutionDetail;
  flow?: ZenithLineItemFlow;
}) {
  const isAddRow = flow === "add-row";
  const tooltip = isAddRow
    ? resolution.kind === "mapped"
      ? `Added ${resolution.itemName} to contract`
      : `Created and added ${resolution.itemName}`
    : resolution.kind === "mapped"
      ? `Linked to ${resolution.itemName}`
      : resolution.kind === "created"
        ? `Created ${resolution.itemName}`
        : `Approved match for ${resolution.itemName}`;

  return (
    <StatusIconWithTooltip tooltip={tooltip}>
      <CircleCheck size={16} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />
    </StatusIconWithTooltip>
  );
}

function ItemsMappingAlert({ unmappedCount }: { unmappedCount: number }) {
  if (unmappedCount === 0) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3"
    >
      <Info size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-red-600" aria-hidden />
      <p className="min-w-0 text-[13px] leading-snug text-red-900">
        <span className="font-semibold">
          We couldn&apos;t find a match for {unmappedCount} item{unmappedCount === 1 ? "" : "s"}.
        </span>{" "}
        <span className="text-red-800">
          Map them with existing items or create new with extracted data
        </span>
      </p>
    </div>
  );
}

function EditableSelectCell({
  value,
  label,
  onClick,
  inFocusedRow = false,
  isPlaceholder = false,
}: {
  value: string;
  label: string;
  onClick?: () => void;
  inFocusedRow?: boolean;
  isPlaceholder?: boolean;
}) {
  const className = cn(
    editableCellClass(inFocusedRow),
    "relative justify-between gap-2 text-left",
    onClick && "cursor-pointer",
  );
  const valueClass = cn(
    "min-w-0 truncate",
    isPlaceholder ? "font-normal text-text-muted" : "font-medium",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <span className={valueClass}>{value}</span>
        <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-text-muted" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <div className={className} role="img" aria-label={label}>
      <span className={valueClass}>{value}</span>
      {!isPlaceholder ? (
        <ChevronDown size={14} strokeWidth={2} className="shrink-0 text-text-muted" aria-hidden />
      ) : null}
    </div>
  );
}

function EditableInputCell({
  value,
  label,
  align = "left",
  inFocusedRow = false,
  isPlaceholder = false,
}: {
  value: string;
  label: string;
  align?: "left" | "right";
  inFocusedRow?: boolean;
  isPlaceholder?: boolean;
}) {
  return (
    <input
      type="text"
      readOnly
      value={value}
      aria-label={label}
      className={cn(
        editableCellClass(inFocusedRow),
        "tabular-nums",
        align === "right" ? "justify-end text-right" : "text-left",
        isPlaceholder && "font-normal text-text-muted",
      )}
    />
  );
}

const PANEL_SEGMENTS_MAPPING: { id: MappedPanelMode; label: string }[] = [
  { id: "match", label: "View match" },
  { id: "map", label: "Map to existing" },
  { id: "create", label: "Create new" },
];

const PANEL_SEGMENTS_ADD_ROW: { id: MappedPanelMode; label: string }[] = [
  { id: "map", label: "Choose existing" },
  { id: "create", label: "Create new" },
];

function MappedItemPanelNav({
  mode,
  variant,
  flow = "mapping",
  onChange,
}: {
  mode: MappedPanelMode;
  variant: "with-match" | "map-create-only";
  flow?: ZenithLineItemFlow;
  onChange: (mode: MappedPanelMode) => void;
}) {
  const segments =
    flow === "add-row"
      ? PANEL_SEGMENTS_ADD_ROW
      : variant === "map-create-only"
        ? PANEL_SEGMENTS_MAPPING.filter((segment) => segment.id !== "match")
        : PANEL_SEGMENTS_MAPPING;

  return (
    <div
      role="tablist"
      aria-label={flow === "add-row" ? "Add line item options" : "Item mapping options"}
      className="inline-flex w-fit rounded-lg border border-border-default bg-gray-100 p-0.5"
    >
      {segments.map((segment) => (
        <button
          key={segment.id}
          type="button"
          role="tab"
          aria-selected={mode === segment.id}
          onClick={() => onChange(segment.id)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
            mode === segment.id
              ? "bg-white text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          {segment.label}
        </button>
      ))}
    </div>
  );
}

function ItemMappingSuccessLayer({
  resolution,
  embedded = false,
  flow = "mapping",
  onChange,
}: {
  resolution: LineItemResolutionDetail;
  embedded?: boolean;
  flow?: ZenithLineItemFlow;
  onChange: () => void;
}) {
  const isAddRow = flow === "add-row";
  const message = isAddRow
    ? resolution.kind === "mapped"
      ? `Added ${resolution.itemName} to contract`
      : `Created and added ${resolution.itemName}`
    : resolution.kind === "mapped"
      ? `Linked to existing item ${resolution.itemName}`
      : resolution.kind === "created"
        ? `Created new item ${resolution.itemName}`
        : `Approved match for ${resolution.itemName}`;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-4",
        embedded ? "py-0.5" : "bg-[#E6F9E9] px-3 py-3",
      )}
    >
      <p className="text-[13px] font-medium leading-snug text-emerald-800">{message}</p>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 text-[12px] font-semibold text-[color:var(--color-info)] transition-colors hover:text-blue-700 hover:underline"
      >
        Change
      </button>
    </div>
  );
}

/** Match-found strip — default expanded view (no segmented nav). */
function MatchedItemFoundLayer({
  item,
  matchedCatalogItemId = DEFAULT_MATCHED_CATALOG_ITEM_ID,
  embedded = false,
  onApproveMatch,
  onMapExisting,
  onCreateNew,
}: {
  item: ZenithSummaryLineItem;
  matchedCatalogItemId?: string;
  embedded?: boolean;
  onApproveMatch: () => void;
  onMapExisting: () => void;
  onCreateNew: () => void;
}) {
  const matchMeta = `${item.frequency} · ${formatMatchUnitPrice(item.unitPrice)}`;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-4",
        embedded ? "py-0.5" : "bg-[#E6F9E9] px-3 py-3",
      )}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-[13px] font-medium leading-snug text-emerald-700">Match found</p>
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px] leading-snug">
          <span className="inline-flex min-w-0 flex-wrap items-center gap-1.5 font-bold text-emerald-900">
            <span className="truncate">{item.name}</span>
            <CatalogItemActiveTag />
            <CatalogItemExternalLink
              itemId={matchedCatalogItemId}
              itemName={item.name}
              className="text-emerald-700/70 hover:text-emerald-800"
            />
          </span>
          <span className="font-bold text-emerald-900">· {matchMeta}</span>
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onApproveMatch}
          className="inline-flex h-7 items-center rounded-full border border-emerald-500 bg-white/90 px-2.5 text-[11px] font-medium text-emerald-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50"
        >
          Approve match
        </button>
        <div className="mx-0.5 h-3.5 w-px shrink-0 bg-border-default" aria-hidden />
        <button
          type="button"
          onClick={onMapExisting}
          className="inline-flex h-7 items-center rounded-full border border-border-default bg-white/90 px-2.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-gray-300 hover:bg-white hover:text-text-primary"
        >
          Map to existing
        </button>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex h-7 items-center rounded-full px-2 text-[11px] font-medium text-[color:var(--color-info)] transition-colors hover:bg-white/60 hover:text-blue-700"
        >
          Create new
        </button>
      </div>
    </div>
  );
}

function LineItemExpandedLayer({
  item,
  needsMapping,
  panelMode,
  showPanelNav,
  resolution,
  surfaceTone,
  mappedCatalogId,
  onPanelModeChange,
  onRevealPanelNav,
  onMapCatalogItem,
  onItemCreated,
  onApproveMatch,
  onClearResolution,
  showExtractedSummary = true,
  flow = "mapping",
}: {
  item: ZenithSummaryLineItem;
  needsMapping: boolean;
  panelMode: MappedPanelMode;
  showPanelNav: boolean;
  resolution?: LineItemResolutionDetail;
  surfaceTone: ExpandedSurfaceTone;
  mappedCatalogId: string | null;
  onPanelModeChange: (mode: MappedPanelMode) => void;
  onRevealPanelNav: () => void;
  onMapCatalogItem: (catalogItemId: string) => void;
  onItemCreated: (payload: ZenithCreateItemPayload) => void;
  onApproveMatch?: () => void;
  onClearResolution: () => void;
  showExtractedSummary?: boolean;
  flow?: ZenithLineItemFlow;
}) {
  const surface = EXPANDED_SURFACE[surfaceTone];
  const isAddRow = flow === "add-row";
  function openMapPanel() {
    onRevealPanelNav();
    onPanelModeChange("map");
  }

  function openCreatePanel() {
    onRevealPanelNav();
    onPanelModeChange("create");
  }

  const navVariant = isAddRow || needsMapping ? "map-create-only" : "with-match";
  const showSegmentedNav = isAddRow
    ? resolution == null
    : needsMapping
      ? resolution == null
      : showPanelNav && panelMode !== "match" && resolution == null;

  if (resolution) {
    return (
      <div className={cn("border-t px-3 py-3", surface.divider)}>
        <ItemMappingSuccessLayer
          embedded
          resolution={resolution}
          flow={flow}
          onChange={onClearResolution}
        />
      </div>
    );
  }

  return (
    <div className={cn("border-t px-3 py-3", surface.divider)}>
      {showSegmentedNav ? (
        <div className="mb-3">
          <MappedItemPanelNav
            mode={panelMode}
            variant={navVariant}
            flow={flow}
            onChange={onPanelModeChange}
          />
        </div>
      ) : null}
      <div>
        {panelMode === "match" && !needsMapping && onApproveMatch ? (
          <MatchedItemFoundLayer
            embedded
            item={item}
            matchedCatalogItemId={
              mappedCatalogId ?? DEFAULT_MATCHED_CATALOG_ITEM_ID
            }
            onApproveMatch={onApproveMatch}
            onMapExisting={openMapPanel}
            onCreateNew={openCreatePanel}
          />
        ) : null}
        {panelMode === "map" ? (
          <ZenithItemMapToExistingPanel
            embedded
            mappedItemId={mappedCatalogId}
            onMapItem={onMapCatalogItem}
            flow={isAddRow ? "add-row" : "mapping"}
          />
        ) : null}
        {panelMode === "create" ? (
          <ZenithItemCreateNewPanel
            embedded
            extractedItem={item}
            showExtractedSummary={showExtractedSummary}
            onCreate={onItemCreated}
          />
        ) : null}
      </div>
    </div>
  );
}

function ItemsTableRow({
  item,
  expanded,
  panelMode,
  showPanelNav,
  resolution,
  mappedCatalogId,
  onToggleExpand,
  onPanelModeChange,
  onRevealPanelNav,
  onMapCatalogItem,
  onItemCreated,
  onApproveMatch,
  onClearResolution,
  onDismissSuccess,
  showExtractedSummary = true,
  isAddRow = false,
}: {
  item: ZenithSummaryLineItem;
  expanded: boolean;
  panelMode: MappedPanelMode;
  showPanelNav: boolean;
  resolution?: LineItemResolutionDetail;
  mappedCatalogId: string | null;
  onToggleExpand: () => void;
  onPanelModeChange: (mode: MappedPanelMode) => void;
  onRevealPanelNav: () => void;
  onMapCatalogItem: (catalogItemId: string) => void;
  onItemCreated: (payload: ZenithCreateItemPayload) => void;
  onApproveMatch: () => void;
  onClearResolution: () => void;
  onDismissSuccess: () => void;
  showExtractedSummary?: boolean;
  isAddRow?: boolean;
}) {
  const flow: ZenithLineItemFlow = isAddRow ? "add-row" : "mapping";
  const needsMapping = !isAddRow && item.mappingStatus === "needs_mapping";
  const mapped = item.mappingStatus === "mapped";
  const expandable = isAddRow || mapped || item.mappingStatus === "needs_mapping";
  const resolved = resolution != null;
  const showRowPlaceholders = isAddRow && !resolved;
  const expandedActive = expanded && expandable;
  const surfaceTone = isAddRow
    ? resolved
      ? "resolved"
      : "work"
    : getExpandedSurfaceTone(needsMapping, panelMode, resolved);
  const surface = EXPANDED_SURFACE[surfaceTone];

  useEffect(() => {
    if (!resolution || !expanded) return;
    const timer = window.setTimeout(() => {
      onDismissSuccess();
    }, SUCCESS_MESSAGE_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [resolution, expanded, onDismissSuccess]);

  function renderStatusIcon() {
    if (isAddRow && !resolved) {
      return null;
    }
    if (resolved) {
      return <ResolvedStatusIcon resolution={resolution} flow={flow} />;
    }
    if (mapped) {
      return <MappedStatusIcon onClick={onToggleExpand} />;
    }
    return <UnmappedStatusIcon onClick={onToggleExpand} />;
  }

  return (
    <>
      <tr
        className={cn(
          "bg-white",
          needsMapping && !resolved && "shadow-[inset_3px_0_0_#ef4444]",
          expandedActive && surface.row,
        )}
      >
        <td
          rowSpan={expandedActive ? 2 : 1}
          className={cn(
            tdClass,
            "w-10 align-top",
            expandedActive && "border-b-0 bg-transparent",
          )}
        >
          <div
            className={cn(
              "flex items-center justify-center",
              expandedActive ? "min-h-full py-2" : "h-9",
            )}
          >
            {renderStatusIcon()}
          </div>
        </td>
        <td
          className={cn(
            tdClass,
            "min-w-[200px]",
            expandedActive && "border-b-0 bg-transparent",
          )}
        >
          <EditableSelectCell
            value={formatLineItemCellText(item.name, showRowPlaceholders)}
            label={
              isAddRow
                ? "Choose item to add"
                : expandable
                  ? "Open item mapping options"
                  : "Item"
            }
            onClick={expandable ? onToggleExpand : undefined}
            inFocusedRow={expandedActive}
            isPlaceholder={showRowPlaceholders}
          />
        </td>
        <td
          className={cn(
            tdClass,
            "min-w-[140px]",
            expandedActive && "border-b-0 bg-transparent",
          )}
        >
          <EditableSelectCell
            value={formatLineItemCellText(item.frequency, showRowPlaceholders)}
            label="Frequency"
            inFocusedRow={expandedActive}
            isPlaceholder={showRowPlaceholders}
          />
        </td>
        <td
          className={cn(tdClass, "w-[88px]", expandedActive && "border-b-0 bg-transparent")}
        >
          <EditableInputCell
            value={formatLineItemQuantity(item.quantity, showRowPlaceholders)}
            label="Quantity"
            align="right"
            inFocusedRow={expandedActive}
            isPlaceholder={showRowPlaceholders}
          />
        </td>
        <td
          className={cn(tdClass, "w-[120px]", expandedActive && "border-b-0 bg-transparent")}
        >
          <EditableInputCell
            value={formatLineItemMoney(item.unitPrice, showRowPlaceholders)}
            label="Unit price"
            align="right"
            inFocusedRow={expandedActive}
            isPlaceholder={showRowPlaceholders}
          />
        </td>
        <td
          className={cn(tdClass, "w-[120px]", expandedActive && "border-b-0 bg-transparent")}
        >
          <EditableInputCell
            value={formatLineItemMoney(item.totalPrice, showRowPlaceholders)}
            label="Total price"
            align="right"
            inFocusedRow={expandedActive}
            isPlaceholder={showRowPlaceholders}
          />
        </td>
        <td className={cn(tdClass, "w-11", expandedActive && "border-b-0 bg-transparent")}>
          <div className="flex h-9 items-center justify-center">
            <button
              type="button"
              className="rounded p-1 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
              aria-label={`Actions for ${item.name}`}
            >
              <MoreVertical size={16} strokeWidth={2} />
            </button>
          </div>
        </td>
      </tr>
      {expandedActive ? (
        <tr className={surface.row}>
          <td colSpan={6} className="border-b border-border-subtle p-0 align-top">
            <LineItemExpandedLayer
              item={item}
              needsMapping={needsMapping}
              panelMode={panelMode}
              showPanelNav={showPanelNav}
              resolution={resolution}
              surfaceTone={surfaceTone}
              mappedCatalogId={mappedCatalogId}
              onPanelModeChange={onPanelModeChange}
              onRevealPanelNav={onRevealPanelNav}
              onMapCatalogItem={onMapCatalogItem}
              onItemCreated={onItemCreated}
              onApproveMatch={mapped ? onApproveMatch : undefined}
              onClearResolution={onClearResolution}
              showExtractedSummary={showExtractedSummary}
              flow={flow}
            />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function captureMainScrollTop(): number | null {
  const scrollEl = getMainScrollContainer();
  return scrollEl ? scrollEl.scrollTop : null;
}

function restoreMainScrollTop(top: number) {
  const scrollEl = getMainScrollContainer();
  if (scrollEl) scrollEl.scrollTop = top;
}

export function ZenithContractItemsTab() {
  const chrome = useZenithContractChrome();
  const [lineItems, setLineItems] = useState<ZenithSummaryLineItem[]>(() => [
    ...zenithSummaryLineItems,
  ]);
  const [addRowDraftId, setAddRowDraftId] = useState<string | null>(null);

  useEffect(() => {
    const itemsForChrome = addRowDraftId
      ? lineItems.filter((line) => line.id !== addRowDraftId)
      : lineItems;
    chrome?.setContractLineItems(itemsForChrome);
  }, [chrome, lineItems, addRowDraftId]);
  const unmappedCount = zenithSummaryLineItemsNeedMappingCount(
    lineItems.filter((line) => line.id !== addRowDraftId),
  );
  const pendingScrollTopRef = useRef<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<MappedPanelMode>("match");
  const [showPanelNav, setShowPanelNav] = useState(false);
  const [mappedCatalogByLine, setMappedCatalogByLine] = useState<Record<string, string>>({});
  const [lineItemResolution, setLineItemResolution] = useState<
    Record<string, LineItemResolutionDetail>
  >({});

  const lockScrollForLayoutChange = useCallback(() => {
    pendingScrollTopRef.current = captureMainScrollTop();
  }, []);

  useLayoutEffect(() => {
    const pending = pendingScrollTopRef.current;
    if (pending == null) return;
    restoreMainScrollTop(pending);
    pendingScrollTopRef.current = null;
  }, [expandedItemId, panelMode, showPanelNav]);

  function resolveLineItem(lineId: string, detail: LineItemResolutionDetail) {
    lockScrollForLayoutChange();
    setLineItemResolution((prev) => ({ ...prev, [lineId]: detail }));
  }

  function clearLineItemResolution(lineId: string) {
    const previous = lineItemResolution[lineId];
    lockScrollForLayoutChange();

    setLineItemResolution((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setMappedCatalogByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    if (previous?.kind === "mapped") {
      setPanelMode("map");
      setShowPanelNav(true);
    } else if (previous?.kind === "created") {
      setPanelMode("create");
      setShowPanelNav(true);
    } else if (previous?.kind === "approved") {
      setPanelMode("match");
      setShowPanelNav(false);
    }
  }

  function resetExpandedPanel() {
    setPanelMode("match");
    setShowPanelNav(false);
  }

  function openLineItemPanel(item: ZenithSummaryLineItem) {
    if (item.mappingStatus === "needs_mapping") {
      setPanelMode("map");
      setShowPanelNav(true);
    } else {
      setPanelMode("match");
      setShowPanelNav(false);
    }
  }

  const dismissExpandedSuccess = useCallback(() => {
    lockScrollForLayoutChange();
    setExpandedItemId(null);
    resetExpandedPanel();
    setAddRowDraftId(null);
  }, [lockScrollForLayoutChange]);

  function clearAddRowDraftIf(lineId: string) {
    setAddRowDraftId((draftId) => (draftId === lineId ? null : draftId));
  }

  function applyCatalogToLine(lineId: string, catalogItemId: string) {
    const catalogItem = getZenithCatalogItemById(catalogItemId);
    if (!catalogItem) return;
    setLineItems((prev) =>
      prev.map((line) =>
        line.id === lineId ? lineItemFromCatalog(line, catalogItem) : line,
      ),
    );
    setMappedCatalogByLine((prev) => ({ ...prev, [lineId]: catalogItemId }));
    clearAddRowDraftIf(lineId);
    resolveLineItem(lineId, {
      kind: "mapped",
      itemName: catalogItem.name,
    });
  }

  function applyCreateToLine(lineId: string, payload: ZenithCreateItemPayload) {
    setLineItems((prev) =>
      prev.map((line) =>
        line.id === lineId ? lineItemFromCreatePayload(line, payload) : line,
      ),
    );
    clearAddRowDraftIf(lineId);
    resolveLineItem(lineId, { kind: "created", itemName: payload.name });
  }

  function startAddRow() {
    if (addRowDraftId) return;
    const id = `li-new-${Date.now()}`;
    const draft = createDraftLineItem(id);
    lockScrollForLayoutChange();
    setLineItems((prev) => [...prev, draft]);
    setAddRowDraftId(id);
    setExpandedItemId(id);
    setPanelMode("map");
    setShowPanelNav(true);
  }

  function removeDraftRow(lineId: string) {
    setLineItems((prev) => prev.filter((line) => line.id !== lineId));
    setAddRowDraftId(null);
    setLineItemResolution((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setMappedCatalogByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }

  const draftItem = addRowDraftId
    ? lineItems.find((line) => line.id === addRowDraftId)
    : undefined;
  const tableLineItems = lineItems.filter((line) => line.id !== addRowDraftId);

  useEffect(() => {
    if (!draftItem) return;
    const resolution = lineItemResolution[draftItem.id];
    if (!resolution) return;
    const timer = window.setTimeout(() => {
      dismissExpandedSuccess();
    }, SUCCESS_MESSAGE_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [draftItem, lineItemResolution, dismissExpandedSuccess]);

  function cancelAddRow() {
    if (!addRowDraftId) return;
    lockScrollForLayoutChange();
    removeDraftRow(addRowDraftId);
    setExpandedItemId(null);
    resetExpandedPanel();
  }

  function toggleLineItem(item: ZenithSummaryLineItem) {
    const canExpand =
      item.mappingStatus === "mapped" || item.mappingStatus === "needs_mapping";
    if (!canExpand) return;
    lockScrollForLayoutChange();
    setExpandedItemId((prev) => {
      if (prev === item.id) {
        resetExpandedPanel();
        if (addRowDraftId === item.id) {
          removeDraftRow(item.id);
        }
        return null;
      }
      openLineItemPanel(item);
      return item.id;
    });
  }

  return (
    <div className="flex flex-col gap-4">
        <ItemsMappingAlert unmappedCount={unmappedCount} />

        <div className="overflow-hidden rounded-xl border border-border-default">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th className={cn(thClass, "w-10 text-center")} aria-hidden />
                  <th className={thClass}>Item</th>
                  <th className={thClass}>Frequency</th>
                  <th className={cn(thClass, "text-right")}>Qty</th>
                  <th className={cn(thClass, "text-right")}>Unit price</th>
                  <th className={cn(thClass, "text-right")}>Total price</th>
                  <th className={cn(thClass, "w-11")} aria-hidden />
                </tr>
              </thead>
              <tbody>
                {tableLineItems.map((item) => (
                  <ItemsTableRow
                    key={item.id}
                    item={item}
                    expanded={expandedItemId === item.id}
                    panelMode={expandedItemId === item.id ? panelMode : "match"}
                    showPanelNav={expandedItemId === item.id && showPanelNav}
                    resolution={lineItemResolution[item.id]}
                    mappedCatalogId={mappedCatalogByLine[item.id] ?? null}
                    onToggleExpand={() => toggleLineItem(item)}
                    onPanelModeChange={(mode) => {
                      lockScrollForLayoutChange();
                      setPanelMode(mode);
                    }}
                    onRevealPanelNav={() => {
                      lockScrollForLayoutChange();
                      setShowPanelNav(true);
                    }}
                    onMapCatalogItem={(catalogItemId) => applyCatalogToLine(item.id, catalogItemId)}
                    onItemCreated={(payload) => applyCreateToLine(item.id, payload)}
                    onApproveMatch={() => {
                      const catalogItem = getZenithCatalogItemById(DEFAULT_MATCHED_CATALOG_ITEM_ID);
                      setLineItems((prev) =>
                        prev.map((line) =>
                          line.id === item.id && catalogItem
                            ? lineItemFromCatalog(line, catalogItem)
                            : line,
                        ),
                      );
                      setMappedCatalogByLine((prev) => ({
                        ...prev,
                        [item.id]: DEFAULT_MATCHED_CATALOG_ITEM_ID,
                      }));
                      resolveLineItem(item.id, {
                        kind: "approved",
                        itemName: catalogItem?.name ?? item.name,
                      });
                    }}
                    onClearResolution={() => clearLineItemResolution(item.id)}
                    onDismissSuccess={dismissExpandedSuccess}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-xl border border-dashed border-border-default bg-white",
            draftItem ? "border-gray-300" : "bg-gray-50/40",
          )}
        >
          {draftItem ? (
            <div>
              <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-2.5">
                <p className="text-[13px] font-semibold text-text-primary">Add line item</p>
                <button
                  type="button"
                  onClick={cancelAddRow}
                  className="text-[12px] font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
              <LineItemExpandedLayer
                item={draftItem}
                needsMapping
                panelMode={panelMode}
                showPanelNav={showPanelNav}
                resolution={lineItemResolution[draftItem.id]}
                surfaceTone="work"
                mappedCatalogId={mappedCatalogByLine[draftItem.id] ?? null}
                onPanelModeChange={(mode) => {
                  lockScrollForLayoutChange();
                  setPanelMode(mode);
                }}
                onRevealPanelNav={() => {
                  lockScrollForLayoutChange();
                  setShowPanelNav(true);
                }}
                onMapCatalogItem={(catalogItemId) => applyCatalogToLine(draftItem.id, catalogItemId)}
                onItemCreated={(payload) => applyCreateToLine(draftItem.id, payload)}
                onClearResolution={() => clearLineItemResolution(draftItem.id)}
                showExtractedSummary={false}
                flow="add-row"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={startAddRow}
              className="flex h-11 w-full items-center justify-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-gray-50/80 hover:text-text-primary"
            >
              <Plus size={14} strokeWidth={2} />
              Add row
            </button>
          )}
        </div>
    </div>
  );
}
