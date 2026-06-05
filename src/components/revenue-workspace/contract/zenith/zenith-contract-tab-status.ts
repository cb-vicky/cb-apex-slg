import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";

export type ZenithTabCompletionStatus = "pending" | "complete" | "disabled";

export interface ZenithContractItemsCompleteInput {
  items: ZenithSummaryLineItem[];
}

/** Items tab is complete when every contract line is mapped. */
export function areZenithContractItemsComplete(input: ZenithContractItemsCompleteInput): boolean {
  const { items } = input;
  return items.length > 0 && items.every((item) => item.mappingStatus === "mapped");
}

/**
 * Summary and Invoice Preview are complete by default when Items are resolved.
 * The operator only needs to resolve item conflicts — all other tabs are implicitly complete.
 */
export function areZenithSummaryPrerequisiteTabsComplete(input: {
  itemsComplete: boolean;
}): boolean {
  return input.itemsComplete;
}

/** Invoice Preview is enabled when Items are resolved. */
export function isZenithInvoicePreviewEnabled(input: {
  itemsComplete: boolean;
}): boolean {
  return input.itemsComplete;
}
