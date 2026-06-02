import {
  countPendingBillingGapItems,
  getBillingGapItemsForIngest,
  type ContractBillingGapResolution,
} from "@/data/contract-line-items";
import type { IngestQueueSampleId } from "@/data/ingest-data";
import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";
import type { ZenithContractContentTab } from "./zenith-contract-tabs";

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

/** Tabs the user marks done manually (Summary completes when these + Items are done). */
export const ZENITH_MANUAL_COMPLETE_TABS: ZenithContractContentTab[] = [
  "Billing info",
  "Addresses",
];

export const ZENITH_SUMMARY_PREREQUISITE_TABS: ZenithContractContentTab[] = [
  "Items",
  ...ZENITH_MANUAL_COMPLETE_TABS,
];

export function areZenithSummaryPrerequisiteTabsComplete(input: {
  itemsComplete: boolean;
  manualComplete: Partial<Record<ZenithContractContentTab, boolean>>;
}): boolean {
  if (!input.itemsComplete) return false;
  return ZENITH_MANUAL_COMPLETE_TABS.every((tab) => Boolean(input.manualComplete[tab]));
}

/** Invoice Preview is enabled when Items, Billing info, and Addresses are all complete */
export function isZenithInvoicePreviewEnabled(input: {
  itemsComplete: boolean;
  manualComplete: Partial<Record<ZenithContractContentTab, boolean>>;
}): boolean {
  if (!input.itemsComplete) return false;
  return ZENITH_MANUAL_COMPLETE_TABS.every((tab) => Boolean(input.manualComplete[tab]));
}
