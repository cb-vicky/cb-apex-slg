import type { ZenithSummaryLineItem } from "@/data/zenith-contract-summary";
import type { ZenithContractContentTab } from "./zenith-contract-tabs";

export type ZenithTabCompletionStatus = "pending" | "complete";

/** Items tab is complete when every contract line is mapped to the catalog. */
export function areZenithContractItemsComplete(items: ZenithSummaryLineItem[]): boolean {
  return items.length > 0 && items.every((item) => item.mappingStatus === "mapped");
}

/** Tabs the user marks done manually (Summary completes when these + Items are done). */
export const ZENITH_MANUAL_COMPLETE_TABS: ZenithContractContentTab[] = [
  "Billing info",
  "Addresses",
  "Additional info",
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
