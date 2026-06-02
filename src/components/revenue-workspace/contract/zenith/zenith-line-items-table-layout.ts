/** Shared column layout for Zenith contract line items (Items tab + drawer pinned strip). */

import { cn } from "@/lib/utils";

export const zenithLineItemsTableClassName =
  "w-full min-w-[720px] border-collapse text-[13px]";

export const zenithLineItemsThClass =
  "border-b border-r border-border-subtle bg-gray-100 px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-text-secondary last:border-r-0";

export const zenithLineItemsTdClass =
  "border-b border-r border-border-subtle p-0 align-middle last:border-r-0";

/** Dashed borders for billing-rule rows — visually separate from solid contract lines. */
export function zenithLineItemsBillingGapTdClass(
  column: "first" | "middle" | "last",
  row: { isFirst: boolean; isLast: boolean },
): string {
  return cn(
    "border-border-subtle border-dashed bg-white p-0 align-middle",
    "border-r border-b",
    row.isFirst && "border-t",
    column === "last" && "border-r",
    row.isLast && column === "first" && "rounded-bl-xl",
    row.isLast && column === "last" && "rounded-br-xl",
  );
}

export const zenithLineItemsCellInnerClass =
  "flex h-9 w-full min-w-0 items-center px-3 text-[13px] text-text-primary";

export const zenithLineItemsCellInnerRightClass =
  `${zenithLineItemsCellInnerClass} justify-end tabular-nums`;
