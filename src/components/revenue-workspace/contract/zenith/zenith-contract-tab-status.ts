import {
  countPendingBillingGapItems,
  getBillingGapItemsForIngest,
  type ContractBillingGapResolution,
} from "@/data/contract-line-items";
import type { IngestQueueSampleId } from "@/data/ingest-data";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";

export type ZenithTabCompletionStatus = "pending" | "complete" | "disabled";

export interface ZenithContractItemsCompleteInput {
  items: ZenithSummaryLineItem[];
  sampleId?: IngestQueueSampleId;
  billingGapResolutions?: Readonly<Record<string, ContractBillingGapResolution>>;
}

/** Items tab is complete when every contract line is mapped and billing-rule gaps are resolved. */
export function areZenithContractItemsComplete(input: ZenithContractItemsCompleteInput): boolean {
  const { items, sampleId, billingGapResolutions = {} } = input;
  const allMapped = items.length > 0 && items.every((item) => item.mappingStatus === "mapped");
  if (!allMapped) return false;

  const gapItems = getBillingGapItemsForIngest(sampleId, items);
  return countPendingBillingGapItems(gapItems, billingGapResolutions) === 0;
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
