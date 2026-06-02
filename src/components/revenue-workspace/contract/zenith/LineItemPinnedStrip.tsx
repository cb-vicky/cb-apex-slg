import type { ReactNode } from "react";
import { CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { isContractLineBillingRuleMatch, isContractLineSystemMatch } from "@/data/contract-line-items";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";
import { zenithLineItemsTableClassName } from "./zenith-line-items-table-layout";

const EMPTY = "—";

const stripTdClass =
  "border-r border-blue-100/60 p-0 align-middle last:border-r-0";

const stripLabelClass =
  "mb-px text-[10px] font-normal leading-none tracking-wide text-text-muted/80";

export type LineItemPinnedStripResolution = {
  kind: "mapped" | "created" | "approved";
  itemName: string;
};

function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function cellText(value: string, usePlaceholder: boolean): string {
  if (usePlaceholder) return EMPTY;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : EMPTY;
}

function quantityText(quantity: number, usePlaceholder: boolean): string {
  if (usePlaceholder || quantity <= 0) return usePlaceholder ? EMPTY : String(quantity);
  return String(quantity);
}

function moneyText(amount: number, usePlaceholder: boolean): string {
  if (usePlaceholder) return EMPTY;
  return formatMoney(amount);
}

function isYellowUnresolvedStripItem(
  item: ZenithSummaryLineItem,
  resolution?: LineItemPinnedStripResolution,
): boolean {
  if (resolution) return false;
  return item.mappingStatus === "needs_mapping" || isContractLineBillingRuleMatch(item);
}

function StripStatusIcon({
  item,
  resolution,
}: {
  item: ZenithSummaryLineItem;
  resolution?: LineItemPinnedStripResolution;
}) {
  if (resolution) {
    return <CircleCheck size={15} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />;
  }
  if (isContractLineBillingRuleMatch(item)) {
    return <Info size={14} strokeWidth={2.25} className="shrink-0 text-amber-600" aria-hidden />;
  }
  if (isContractLineSystemMatch(item)) {
    return <Info size={14} strokeWidth={2.25} className="shrink-0 text-emerald-600" aria-hidden />;
  }
  if (item.mappingStatus === "mapped") {
    return <CircleCheck size={15} strokeWidth={2} className="shrink-0 text-emerald-600" aria-hidden />;
  }
  return <Info size={14} strokeWidth={2.25} className="shrink-0 text-amber-600" aria-hidden />;
}

function StripLabeledValue({
  label,
  children,
  align = "left",
}: {
  label: string;
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <div className={cn("px-2.5 py-1.5", align === "right" && "text-right")}>
      <p className={cn(stripLabelClass, align === "right" && "text-right")}>{label}</p>
      {children}
    </div>
  );
}

interface Props {
  item: ZenithSummaryLineItem;
  resolution?: LineItemPinnedStripResolution;
  showPlaceholder?: boolean;
  hideAccentStrip?: boolean;
  className?: string;
}

export function LineItemPinnedStrip({
  item,
  resolution,
  showPlaceholder = false,
  hideAccentStrip = false,
  className,
}: Props) {
  const yellowUnresolved = isYellowUnresolvedStripItem(item, resolution);
  const accentBarClass = resolution
    ? "bg-emerald-500"
    : showPlaceholder
      ? "bg-gray-300"
      : yellowUnresolved
        ? "bg-amber-500"
        : "bg-emerald-500";

  const name = cellText(item.name, showPlaceholder);
  const frequency = cellText(item.frequency, showPlaceholder);
  const qty = quantityText(item.quantity, showPlaceholder);
  const unitPrice = moneyText(item.unitPrice, showPlaceholder);
  const totalPrice = moneyText(item.totalPrice, showPlaceholder);
  const isPlaceholder = showPlaceholder;

  const valueClass = (emphasize = false) =>
    cn(
      "text-[12px] leading-tight tabular-nums",
      isPlaceholder ? "text-text-muted" : emphasize ? "font-semibold text-text-primary" : "text-text-primary",
    );

  return (
    <div
      role="region"
      aria-label="Selected line item"
      className={cn(
        "w-full border-b",
        resolution
          ? "border-emerald-200/80 bg-emerald-50/90"
          : "border-blue-100/80 bg-blue-50/90",
        className,
      )}
    >
      <div className="overflow-x-auto px-8">
        <table className={zenithLineItemsTableClassName}>
          <tbody>
            <tr>
              <td className={cn(stripTdClass, "relative w-9")}>
                {!hideAccentStrip ? (
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 w-[3px]",
                      accentBarClass,
                    )}
                  />
                ) : null}
                <div className="relative flex items-center justify-center py-1.5 pl-1 pr-0.5">
                  <span className="sr-only">Status</span>
                  <StripStatusIcon item={item} resolution={resolution} />
                </div>
              </td>
              <td className={cn(stripTdClass, "min-w-[200px]")}>
                <StripLabeledValue label="Item">
                  <p className={cn(valueClass(true), "truncate")}>{name}</p>
                </StripLabeledValue>
              </td>
              <td className={cn(stripTdClass, "min-w-[140px]")}>
                <StripLabeledValue label="Frequency">
                  <p className={cn(valueClass(), "truncate")}>{frequency}</p>
                </StripLabeledValue>
              </td>
              <td className={cn(stripTdClass, "w-[88px]")}>
                <StripLabeledValue label="Qty" align="right">
                  <p className={valueClass()}>{qty}</p>
                </StripLabeledValue>
              </td>
              <td className={cn(stripTdClass, "w-[120px]")}>
                <StripLabeledValue label="Unit price" align="right">
                  <p className={valueClass()}>{unitPrice}</p>
                </StripLabeledValue>
              </td>
              <td className={cn(stripTdClass, "min-w-[120px] last:border-r-0")}>
                <StripLabeledValue label="Total price" align="right">
                  <p className={cn(valueClass(true), "min-w-0 truncate")}>{totalPrice}</p>
                </StripLabeledValue>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
