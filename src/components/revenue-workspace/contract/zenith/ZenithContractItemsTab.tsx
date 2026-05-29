import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useZenithContractChrome } from "./ZenithContractChromeContext";
import { CircleCheck, Info, ChevronDown, Link2, MoreVertical, Plus, UserPlus } from "lucide-react";
import { getZenithCatalogItemById, type ZenithCatalogSiteItem } from "@/data/zenith-catalog-items";
import {
  zenithSummaryLineItems,
  zenithSummaryLineItemsNeedMappingCount,
  type ZenithSummaryLineItem,
} from "@/data/zenith-contract-summary";
import { cn } from "@/lib/utils";
import { WTable, WTbody, WTd, WTr } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/primitives";
import {
  catalogBillingCycle,
  catalogPricingModel,
  catalogProductType,
  catalogTaxableLabel,
  catalogTrialLabel,
  formatCatalogUnitPrice,
} from "./zenith-catalog-display";
import {
  CREATE_CATALOG_ITEM_FORM_ID,
  ZenithItemCreateNewPanel,
  type ZenithCreateItemPayload,
} from "./ZenithItemCreateNewPanel";
import {
  buildInitialCreateCatalogItemForm,
  isCreateCatalogItemFormComplete,
  type CreateCatalogItemFormState,
} from "./create-catalog-item-form";
import { ZenithLineItemBottomDrawer } from "./ZenithLineItemBottomDrawer";
import {
  CatalogItemExternalLink,
  ZenithItemMapToExistingPanel,
} from "./ZenithItemMapToExistingPanel";
import { MatchedItemCondensedStrip } from "./MatchedItemCondensedStrip";

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

function MappedStatusIcon({ onClick }: { onClick?: () => void }) {
  const icon = (
    <Info size={14} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />
  );
  return (
    <StatusIconWithTooltip tooltip="Match found in your site">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label="Toggle matched item details"
          className="rounded p-0.5 text-emerald-600 transition-colors hover:bg-emerald-50"
        >
          {icon}
        </button>
      ) : (
        <span className="inline-flex rounded p-0.5" aria-hidden>
          {icon}
        </span>
      )}
    </StatusIconWithTooltip>
  );
}

function UnmappedStatusIcon({ onClick }: { onClick?: () => void }) {
  const icon = <Info size={14} strokeWidth={2.25} className="shrink-0 text-red-600" aria-hidden />;
  return (
    <StatusIconWithTooltip tooltip="No match found - needs mapping">
      {onClick ? (
        <button
          type="button"
          onClick={onClick}
          aria-label="Open mapping options"
          className="rounded p-0.5 text-red-600 transition-colors hover:bg-red-50"
        >
          {icon}
        </button>
      ) : (
        <span className="inline-flex rounded p-0.5" aria-hidden>
          {icon}
        </span>
      )}
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
  { id: "map", label: "Link to existing" },
  { id: "create", label: "Create new item" },
];

const PANEL_SEGMENTS_ADD_ROW: { id: MappedPanelMode; label: string }[] = [
  { id: "map", label: "Add existing item" },
  { id: "create", label: "Create new item" },
];

function panelSegmentIcon(id: MappedPanelMode) {
  if (id === "create") {
    return <UserPlus size={14} strokeWidth={2} aria-hidden />;
  }
  return <Link2 size={14} strokeWidth={2} aria-hidden />;
}

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
      className="inline-flex w-fit max-w-full rounded-xl border border-border-default bg-white p-1 shadow-sm"
    >
      {segments.map((segment) => (
        <button
          key={segment.id}
          type="button"
          role="tab"
          aria-selected={mode === segment.id}
          onClick={() => onChange(segment.id)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium transition-all duration-200",
            mode === segment.id
              ? "bg-blue-600 text-white shadow-[0_2px_8px_-2px_rgba(37,99,235,0.45)]"
              : "text-text-secondary hover:bg-gray-50 hover:text-text-primary",
          )}
        >
          {panelSegmentIcon(segment.id)}
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

/** Match-found info banner — default expanded view (no segmented nav). */
function MatchedItemFoundLayer({
  item,
  matchedCatalogItemId = DEFAULT_MATCHED_CATALOG_ITEM_ID,
  onApproveMatch,
  onMapExisting,
  onCreateNew,
  hideSecondaryActions = false,
}: {
  item: ZenithSummaryLineItem;
  matchedCatalogItemId?: string;
  onApproveMatch: () => void;
  onMapExisting: () => void;
  onCreateNew: () => void;
  hideSecondaryActions?: boolean;
}) {
  const catalogItem = getZenithCatalogItemById(matchedCatalogItemId);
  const displayName = catalogItem?.name ?? item.name;
  const displaySku = catalogItem?.sku ?? "—";
  const displayStatus = catalogItem?.status ?? "Active";
  const displayFrequency = catalogItem?.billingFrequency ?? item.frequency;
  const displayPricingModel = catalogItem ? catalogPricingModel(catalogItem) : "Flat fee";
  const displayUnitPrice = catalogItem
    ? formatCatalogUnitPrice(catalogItem)
    : formatMatchUnitPrice(item.unitPrice);
  const displayProductType = catalogItem ? catalogProductType(catalogItem) : "Plan";
  const displayBillingCycle = catalogItem ? catalogBillingCycle(catalogItem) : "Forever";
  const displayTrial = catalogItem ? catalogTrialLabel(catalogItem) : "No trial";
  const displayTaxable = catalogItem ? catalogTaxableLabel(catalogItem) : "Yes";

  const catalogColumns = [
    "Item",
    "Item type",
    "Status",
    "Frequency",
    "Pricing model",
    "Unit price",
    "Billing cycle",
    "Trial",
    "Taxable",
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div
        role="status"
        className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Info
              size={16}
              strokeWidth={2}
              className="shrink-0 text-emerald-600"
              aria-hidden
            />
            <p className="text-[13px] font-semibold leading-snug text-emerald-800">Match found</p>
          </div>
          <button
            type="button"
            onClick={onApproveMatch}
            className="inline-flex h-7 shrink-0 items-center rounded-full border border-emerald-500 bg-white px-2.5 text-[11px] font-medium text-emerald-700 transition-colors hover:border-emerald-600 hover:bg-emerald-50/80"
          >
            Approve match
          </button>
        </div>

        <div className="overflow-x-auto border-t border-emerald-200/70 bg-white">
          <WTable className="min-w-[1140px] text-[12px]">
            <thead>
              <tr className="border-b border-border-subtle bg-gray-50">
                {catalogColumns.map((label) => (
                  <th key={label} className="px-2 py-1.5 text-left font-normal">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                      {label}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <WTbody>
              <WTr className="bg-emerald-50/40 hover:bg-emerald-50/40">
                <WTd className="px-2 py-1.5">
                  <div className="flex min-w-[140px] items-center gap-1">
                    <span className="truncate font-medium text-text-primary">{displayName}</span>
                    <span className="shrink-0 text-text-muted">·</span>
                    <span className="truncate text-[11px] text-text-muted">{displaySku}</span>
                    <CatalogItemExternalLink
                      itemId={matchedCatalogItemId}
                      itemName={displayName}
                    />
                  </div>
                </WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayProductType}</WTd>
                <WTd className="px-2 py-1.5">
                  <StatusBadge status={displayStatus} className="py-px text-[11px]" />
                </WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayFrequency}</WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayPricingModel}</WTd>
                <WTd className="px-2 py-1.5 tabular-nums text-text-secondary">{displayUnitPrice}</WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayBillingCycle}</WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayTrial}</WTd>
                <WTd className="px-2 py-1.5 text-text-secondary">{displayTaxable}</WTd>
              </WTr>
            </WTbody>
          </WTable>
        </div>
      </div>

      {!hideSecondaryActions ? (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-0.5">
        <button
          type="button"
          onClick={onMapExisting}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <Link2 size={13} strokeWidth={2} aria-hidden />
          Link to existing
        </button>
        <span className="text-[12px] text-text-muted/50" aria-hidden>
          ·
        </span>
        <button
          type="button"
          onClick={onCreateNew}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-text-muted transition-colors hover:text-text-primary"
        >
          <UserPlus size={13} strokeWidth={2} aria-hidden />
          Create new item
        </button>
      </div>
      ) : null}
    </div>
  );
}

function LineItemExpandedLayer({
  item,
  needsMapping,
  panelMode,
  showPanelNav,
  matchBannerExpanded,
  resolution,
  surfaceTone,
  mappedCatalogId,
  selectedCatalogItemId,
  onSelectCatalogItem,
  onConfirmMapCatalog,
  createCatalogForm,
  onCreateCatalogFormChange,
  onPanelModeChange,
  onRevealPanelNav,
  onExpandMatchBanner,
  onItemCreated,
  onApproveMatch,
  onClearResolution,
  flow = "mapping",
  flushHorizontal = false,
  hideInlineMapConfirm = false,
  hideInlineCreateConfirm = false,
  hideMatchCondensedStrip = false,
}: {
  item: ZenithSummaryLineItem;
  needsMapping: boolean;
  panelMode: MappedPanelMode;
  showPanelNav: boolean;
  matchBannerExpanded: boolean;
  resolution?: LineItemResolutionDetail;
  surfaceTone: ExpandedSurfaceTone;
  mappedCatalogId: string | null;
  selectedCatalogItemId: string | null;
  onSelectCatalogItem: (catalogItemId: string | null) => void;
  onConfirmMapCatalog?: () => void;
  createCatalogForm: CreateCatalogItemFormState;
  onCreateCatalogFormChange: (next: CreateCatalogItemFormState) => void;
  hideInlineCreateConfirm?: boolean;
  onPanelModeChange: (mode: MappedPanelMode) => void;
  onRevealPanelNav: () => void;
  onExpandMatchBanner: () => void;
  onItemCreated: (payload: ZenithCreateItemPayload) => void;
  onApproveMatch?: () => void;
  onClearResolution: () => void;
  flow?: ZenithLineItemFlow;
  flushHorizontal?: boolean;
  hideInlineMapConfirm?: boolean;
  hideMatchCondensedStrip?: boolean;
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

  const navVariant =
    isAddRow || needsMapping || showPanelNav ? "map-create-only" : "with-match";
  const showSegmentedNav = isAddRow
    ? resolution == null
    : needsMapping
      ? resolution == null
      : showPanelNav && panelMode !== "match" && resolution == null;

  const showExpandedMatchBanner =
    !needsMapping &&
    onApproveMatch != null &&
    ((!showPanelNav && panelMode === "match") || matchBannerExpanded);

  const showMatchCondensedStrip =
    !needsMapping && onApproveMatch != null && showPanelNav && !matchBannerExpanded;

  const layerPaddingClass = flushHorizontal ? "px-0" : "px-3";

  if (resolution) {
    return (
      <div className={cn("border-t py-3", layerPaddingClass, surface.divider)}>
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
    <div className={cn("border-t py-3", layerPaddingClass, surface.divider)}>
      {showMatchCondensedStrip && !hideMatchCondensedStrip ? (
        <MatchedItemCondensedStrip
          item={item}
          onExpandMatch={onExpandMatchBanner}
          className="mb-3"
        />
      ) : null}
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
        {showExpandedMatchBanner ? (
          <div className={cn(showSegmentedNav || panelMode !== "match" ? "mb-3" : undefined)}>
            <MatchedItemFoundLayer
              item={item}
              matchedCatalogItemId={
                mappedCatalogId ?? DEFAULT_MATCHED_CATALOG_ITEM_ID
              }
              onApproveMatch={onApproveMatch!}
              onMapExisting={openMapPanel}
              onCreateNew={openCreatePanel}
              hideSecondaryActions={showPanelNav}
            />
          </div>
        ) : null}
        {panelMode === "map" ? (
          <>
            <ZenithItemMapToExistingPanel
              embedded
              selectedItemId={selectedCatalogItemId}
              onSelectItem={onSelectCatalogItem}
              flow={isAddRow ? "add-row" : "mapping"}
            />
            {!hideInlineMapConfirm && selectedCatalogItemId && onConfirmMapCatalog ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onConfirmMapCatalog}
                  className="inline-flex h-8 items-center rounded-full bg-blue-600 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {isAddRow ? "Add to contract" : "Submit"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
        {panelMode === "create" ? (
          <>
            <ZenithItemCreateNewPanel
              embedded
              value={createCatalogForm}
              onChange={onCreateCatalogFormChange}
              onCreate={onItemCreated}
            />
            {!hideInlineCreateConfirm && isCreateCatalogItemFormComplete(createCatalogForm) ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  form={CREATE_CATALOG_ITEM_FORM_ID}
                  className="inline-flex h-8 items-center rounded-full bg-blue-600 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {isAddRow ? "Add to contract" : "Submit"}
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}

function ItemsTableRow({
  item,
  selected,
  resolution,
  onSelect,
}: {
  item: ZenithSummaryLineItem;
  selected: boolean;
  resolution?: LineItemResolutionDetail;
  onSelect: () => void;
}) {
  const needsMapping = item.mappingStatus === "needs_mapping";
  const mapped = item.mappingStatus === "mapped";
  const expandable = mapped || needsMapping;
  const resolved = resolution != null;

  function renderStatusIcon() {
    if (resolved) {
      return <ResolvedStatusIcon resolution={resolution} flow="mapping" />;
    }
    if (mapped) {
      return <MappedStatusIcon />;
    }
    return <UnmappedStatusIcon />;
  }

  return (
    <tr
      className={cn(
        "bg-white",
        needsMapping && !resolved && "shadow-[inset_3px_0_0_#ef4444]",
        selected && "bg-blue-50/60",
        expandable && "cursor-pointer",
      )}
      onClick={expandable ? onSelect : undefined}
    >
      <td className={cn(tdClass, "w-10 align-top")}>
        <div className="flex h-9 items-center justify-center">{renderStatusIcon()}</div>
      </td>
      <td className={cn(tdClass, "min-w-[200px]")}>
        <EditableSelectCell
          value={formatLineItemCellText(item.name, false)}
          label={expandable ? "Open item mapping options" : "Item"}
          inFocusedRow={selected}
        />
      </td>
      <td className={cn(tdClass, "min-w-[140px]")}>
        <EditableSelectCell
          value={formatLineItemCellText(item.frequency, false)}
          label="Frequency"
          inFocusedRow={selected}
        />
      </td>
      <td className={cn(tdClass, "w-[88px]")}>
        <EditableInputCell
          value={formatLineItemQuantity(item.quantity, false)}
          label="Quantity"
          align="right"
          inFocusedRow={selected}
        />
      </td>
      <td className={cn(tdClass, "w-[120px]")}>
        <EditableInputCell
          value={formatLineItemMoney(item.unitPrice, false)}
          label="Unit price"
          align="right"
          inFocusedRow={selected}
        />
      </td>
      <td className={cn(tdClass, "w-[120px]")}>
        <EditableInputCell
          value={formatLineItemMoney(item.totalPrice, false)}
          label="Total price"
          align="right"
          inFocusedRow={selected}
        />
      </td>
      <td className={cn(tdClass, "w-11")}>
        <div className="flex h-9 items-center justify-center">
          <button
            type="button"
            className="rounded p-1 text-text-muted transition-colors hover:bg-gray-100 hover:text-text-primary"
            aria-label={`Actions for ${item.name}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} strokeWidth={2} />
          </button>
        </div>
      </td>
    </tr>
  );
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
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<MappedPanelMode>("match");
  const [showPanelNav, setShowPanelNav] = useState(false);
  const [matchBannerExpanded, setMatchBannerExpanded] = useState(true);
  const [mappedCatalogByLine, setMappedCatalogByLine] = useState<Record<string, string>>({});
  const [pendingCatalogByLine, setPendingCatalogByLine] = useState<Record<string, string>>({});
  const [createCatalogFormByLine, setCreateCatalogFormByLine] = useState<
    Record<string, CreateCatalogItemFormState>
  >({});
  const [lineItemResolution, setLineItemResolution] = useState<
    Record<string, LineItemResolutionDetail>
  >({});

  function resolveLineItem(lineId: string, detail: LineItemResolutionDetail) {
    setLineItemResolution((prev) => ({ ...prev, [lineId]: detail }));
  }

  function clearLineItemResolution(lineId: string) {
    const previous = lineItemResolution[lineId];

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
    setPendingCatalogByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setCreateCatalogFormByLine((prev) => {
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
      setMatchBannerExpanded(true);
    }
  }

  function resetExpandedPanel() {
    setPanelMode("match");
    setShowPanelNav(false);
    setMatchBannerExpanded(true);
  }

  function handlePanelModeChange(mode: MappedPanelMode) {
    setPanelMode(mode);
    if (mode === "map" || mode === "create") {
      setMatchBannerExpanded(false);
    } else if (mode === "match") {
      setMatchBannerExpanded(true);
    }
  }

  function openLineItemPanel(item: ZenithSummaryLineItem) {
    if (item.mappingStatus === "needs_mapping") {
      setPanelMode("map");
      setShowPanelNav(true);
      setMatchBannerExpanded(false);
    } else {
      setPanelMode("match");
      setShowPanelNav(false);
      setMatchBannerExpanded(true);
    }
  }

  const closeLineItemDrawer = useCallback(() => {
    setExpandedItemId((current) => {
      if (!current) return null;

      setAddRowDraftId((draftId) => {
        if (draftId === current) {
          setLineItems((prev) => prev.filter((line) => line.id !== current));
          setLineItemResolution((prev) => {
            const next = { ...prev };
            delete next[current];
            return next;
          });
          setMappedCatalogByLine((prev) => {
            const next = { ...prev };
            delete next[current];
            return next;
          });
          return null;
        }
        return draftId;
      });

      setPendingCatalogByLine((prev) => {
        const next = { ...prev };
        delete next[current];
        return next;
      });
      setCreateCatalogFormByLine((prev) => {
        const next = { ...prev };
        delete next[current];
        return next;
      });
      return null;
    });
    resetExpandedPanel();
  }, []);

  function getCreateCatalogForm(
    lineId: string,
    item: ZenithSummaryLineItem,
  ): CreateCatalogItemFormState {
    return createCatalogFormByLine[lineId] ?? buildInitialCreateCatalogItemForm(item);
  }

  function updateCreateCatalogForm(lineId: string, next: CreateCatalogItemFormState) {
    setCreateCatalogFormByLine((prev) => ({ ...prev, [lineId]: next }));
  }

  function updatePendingCatalogSelection(lineId: string, catalogItemId: string | null) {
    setPendingCatalogByLine((prev) => {
      const next = { ...prev };
      if (!catalogItemId) delete next[lineId];
      else next[lineId] = catalogItemId;
      return next;
    });
  }

  function confirmMapCatalogToLine(lineId: string) {
    const catalogItemId = pendingCatalogByLine[lineId];
    if (!catalogItemId) return;
    applyCatalogToLine(lineId, catalogItemId);
  }

  function closeDrawerAfterSubmit(lineId: string) {
    setExpandedItemId(null);
    resetExpandedPanel();
    setPendingCatalogByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setCreateCatalogFormByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }

  function submitMapCatalogFromDrawer(lineId: string) {
    const catalogItemId = pendingCatalogByLine[lineId];
    if (!catalogItemId) return;
    const isAddRow = addRowDraftId === lineId;

    if (isAddRow) {
      applyCatalogToLine(lineId, catalogItemId);
      closeDrawerAfterSubmit(lineId);
      return;
    }

    closeLineItemDrawer();
    window.setTimeout(() => {
      applyCatalogToLine(lineId, catalogItemId);
    }, 0);
  }

  function submitCreateFromDrawer(lineId: string, payload: ZenithCreateItemPayload) {
    const isAddRow = addRowDraftId === lineId;

    if (isAddRow) {
      applyCreateToLine(lineId, payload);
      closeDrawerAfterSubmit(lineId);
      return;
    }

    closeLineItemDrawer();
    window.setTimeout(() => {
      applyCreateToLine(lineId, payload);
    }, 0);
  }

  const dismissExpandedSuccess = useCallback(() => {
    closeLineItemDrawer();
    setAddRowDraftId(null);
  }, [closeLineItemDrawer]);

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
    setLineItems((prev) => [...prev, draft]);
    setAddRowDraftId(id);
    setPanelMode("map");
    setShowPanelNav(true);
    setExpandedItemId(id);
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
    setPendingCatalogByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
    setCreateCatalogFormByLine((prev) => {
      const next = { ...prev };
      delete next[lineId];
      return next;
    });
  }

  const tableLineItems = lineItems.filter((line) => line.id !== addRowDraftId);
  const drawerItem = expandedItemId
    ? lineItems.find((line) => line.id === expandedItemId)
    : undefined;
  const isAddRowDrawer = Boolean(
    drawerItem && addRowDraftId && drawerItem.id === addRowDraftId,
  );

  useEffect(() => {
    if (!drawerItem || isAddRowDrawer) return;
    const resolution = lineItemResolution[drawerItem.id];
    if (!resolution) return;
    const timer = window.setTimeout(() => {
      dismissExpandedSuccess();
    }, SUCCESS_MESSAGE_AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, [drawerItem, isAddRowDrawer, lineItemResolution, dismissExpandedSuccess]);

  function toggleLineItem(item: ZenithSummaryLineItem) {
    const canExpand =
      item.mappingStatus === "mapped" || item.mappingStatus === "needs_mapping";
    if (!canExpand) return;

    if (addRowDraftId && addRowDraftId !== item.id) {
      removeDraftRow(addRowDraftId);
    }

    setExpandedItemId((prev) => {
      if (prev === item.id) {
        resetExpandedPanel();
        return null;
      }
      openLineItemPanel(item);
      return item.id;
    });
  }

  const drawerNeedsMapping = isAddRowDrawer || drawerItem?.mappingStatus === "needs_mapping";
  const drawerMapped = !isAddRowDrawer && drawerItem?.mappingStatus === "mapped";
  const drawerResolution = drawerItem ? lineItemResolution[drawerItem.id] : undefined;
  const drawerSurfaceTone = drawerItem
    ? getExpandedSurfaceTone(Boolean(drawerNeedsMapping), panelMode, drawerResolution != null)
    : "work";

  function approveDrawerCatalogMatch() {
    if (!drawerItem) return;
    const catalogItem = getZenithCatalogItemById(DEFAULT_MATCHED_CATALOG_ITEM_ID);
    setLineItems((prev) =>
      prev.map((line) =>
        line.id === drawerItem.id && catalogItem
          ? lineItemFromCatalog(line, catalogItem)
          : line,
      ),
    );
    setMappedCatalogByLine((prev) => ({
      ...prev,
      [drawerItem.id]: DEFAULT_MATCHED_CATALOG_ITEM_ID,
    }));
    resolveLineItem(drawerItem.id, {
      kind: "approved",
      itemName: catalogItem?.name ?? drawerItem.name,
    });
  }

  const showDrawerMatchStrip =
    drawerItem != null &&
    drawerMapped &&
    showPanelNav &&
    !matchBannerExpanded &&
    drawerResolution == null;

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
                    selected={expandedItemId === item.id}
                    resolution={lineItemResolution[item.id]}
                    onSelect={() => toggleLineItem(item)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-dashed border-border-default bg-gray-50/40">
          <button
            type="button"
            onClick={startAddRow}
            disabled={addRowDraftId != null}
            className="flex h-11 w-full items-center justify-center gap-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-gray-50/80 hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={14} strokeWidth={2} />
            Add row
          </button>
        </div>

      <ZenithLineItemBottomDrawer
        open={drawerItem != null}
        item={drawerItem ?? null}
        onClose={closeLineItemDrawer}
        headerEyebrow={isAddRowDrawer ? "Add line item" : "Line item"}
        headerTitle={isAddRowDrawer ? "New row" : undefined}
        closeLabel={isAddRowDrawer ? "Close add line item panel" : "Close item panel"}
        pinnedStrip={
          showDrawerMatchStrip && drawerItem ? (
            <MatchedItemCondensedStrip
              item={drawerItem}
              onExpandMatch={() => setMatchBannerExpanded(true)}
              className="px-8"
            />
          ) : undefined
        }
        footer={
          drawerItem && !lineItemResolution[drawerItem.id] ? (
            panelMode === "map" && pendingCatalogByLine[drawerItem.id] ? (
              <div className="flex shrink-0 justify-end border-t border-border-subtle px-8 py-3">
                <button
                  type="button"
                  onClick={() => submitMapCatalogFromDrawer(drawerItem.id)}
                  className="inline-flex h-8 items-center rounded-full bg-blue-600 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  {isAddRowDrawer ? "Add to contract" : "Submit"}
                </button>
              </div>
            ) : panelMode === "create" ? (
              <div className="flex shrink-0 justify-end border-t border-border-subtle px-8 py-3">
                <button
                  type="submit"
                  form={CREATE_CATALOG_ITEM_FORM_ID}
                  disabled={
                    !isCreateCatalogItemFormComplete(
                      getCreateCatalogForm(drawerItem.id, drawerItem),
                    )
                  }
                  className="inline-flex h-8 items-center rounded-full bg-blue-600 px-4 text-[12px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isAddRowDrawer ? "Add to contract" : "Submit"}
                </button>
              </div>
            ) : undefined
          ) : undefined
        }
      >
        {drawerItem ? (
          <LineItemExpandedLayer
            item={drawerItem}
            needsMapping={Boolean(drawerNeedsMapping)}
            panelMode={panelMode}
            showPanelNav={showPanelNav}
            matchBannerExpanded={matchBannerExpanded}
            resolution={drawerResolution}
            surfaceTone={drawerSurfaceTone}
            mappedCatalogId={mappedCatalogByLine[drawerItem.id] ?? null}
            selectedCatalogItemId={pendingCatalogByLine[drawerItem.id] ?? null}
            onSelectCatalogItem={(id) => updatePendingCatalogSelection(drawerItem.id, id)}
            onConfirmMapCatalog={() => submitMapCatalogFromDrawer(drawerItem.id)}
            hideInlineMapConfirm
            createCatalogForm={getCreateCatalogForm(drawerItem.id, drawerItem)}
            onCreateCatalogFormChange={(next) => updateCreateCatalogForm(drawerItem.id, next)}
            hideInlineCreateConfirm
            onPanelModeChange={handlePanelModeChange}
            onRevealPanelNav={() => setShowPanelNav(true)}
            onExpandMatchBanner={() => setMatchBannerExpanded(true)}
            onItemCreated={(payload) => submitCreateFromDrawer(drawerItem.id, payload)}
            onApproveMatch={drawerMapped ? approveDrawerCatalogMatch : undefined}
            onClearResolution={() => clearLineItemResolution(drawerItem.id)}
            hideMatchCondensedStrip
            flushHorizontal
            flow={isAddRowDrawer ? "add-row" : "mapping"}
          />
        ) : null}
      </ZenithLineItemBottomDrawer>
    </div>
  );
}
