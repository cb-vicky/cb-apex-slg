/**
 * Contract line items for Workbench ingestion / contract review (Items tab).
 * Keyed by ingest sample and session contract id — not Zenith-specific.
 */

import { type IngestQueueSampleId } from "@/data/ingest-data";

export type ContractLineItemMappingStatus = "mapped" | "needs_mapping";

/** How a mapped line was linked to the site catalog. */
export type ContractLineItemCatalogLink =
  | "system_match"
  | "user_mapped"
  | "user_created"
  | "billing_rule_match";

export interface ContractLineItem {
  id: string;
  name: string;
  frequency: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  mappingStatus: ContractLineItemMappingStatus;
  /** Set when `mappingStatus` is `mapped` — system_match shows "Match found" UX. */
  catalogLink?: ContractLineItemCatalogLink;
  /** Tooltip copy for rows added from billing-rule suggestions. */
  billingRuleInclusionReason?: string;
}

export function isContractLineSystemMatch(item: ContractLineItem): boolean {
  return item.mappingStatus === "mapped" && item.catalogLink === "system_match";
}

export function isContractLineBillingRuleMatch(item: ContractLineItem): boolean {
  return item.mappingStatus === "mapped" && item.catalogLink === "billing_rule_match";
}

/** Pre-matched catalog rows that open the match-review drawer (system or billing-rule). */
export function isContractLineCatalogMatch(item: ContractLineItem): boolean {
  return isContractLineSystemMatch(item) || isContractLineBillingRuleMatch(item);
}

/** Session contract created after Zenith new-business ingest (`sample2`). */
export const ZENITH_INGEST_CONTRACT_ID = "CON-INGEST-002";

/** Session contract for Pioneer new-business ingest (`sample5`). */
export const PIONEER_INGEST_CONTRACT_ID = "CON-INGEST-005";

/** Default Items-tab rows per Workbench ingest sample. */
export const contractLineItemsByIngestSample: Record<IngestQueueSampleId, ContractLineItem[]> = {
  sample2: [
    {
      id: "li-growth-crm",
      name: "Growth CRM",
      frequency: "Yearly",
      quantity: 25,
      unitPrice: 1200,
      totalPrice: 30000,
      mappingStatus: "mapped",
      catalogLink: "system_match",
    },
    {
      id: "li-onboarding",
      name: "Onboarding & Training",
      frequency: "One-time",
      quantity: 1,
      unitPrice: 2500,
      totalPrice: 2500,
      mappingStatus: "needs_mapping",
    },
    {
      id: "li-support",
      name: "Premium Support Add-on",
      frequency: "Monthly",
      quantity: 1,
      unitPrice: 4200,
      totalPrice: 4200,
      mappingStatus: "mapped",
      catalogLink: "user_mapped",
    },
  ],
  sample3: [],
  sample4: [],
  sample5: [
    {
      id: "li-pioneer-platform",
      name: "Apex Platform – Growth",
      frequency: "Yearly",
      quantity: 50,
      unitPrice: 2400,
      totalPrice: 120000,
      mappingStatus: "mapped",
      catalogLink: "system_match",
    },
    {
      id: "li-pioneer-impl",
      name: "Implementation Services",
      frequency: "One-time",
      quantity: 1,
      unitPrice: 18000,
      totalPrice: 18000,
      mappingStatus: "needs_mapping",
    },
  ],
};

/** Items-tab rows keyed by contract id (ingested + reference contracts). */
export const contractLineItemsByContractId: Record<string, ContractLineItem[]> = {
  [ZENITH_INGEST_CONTRACT_ID]: contractLineItemsByIngestSample.sample2,
  [PIONEER_INGEST_CONTRACT_ID]: contractLineItemsByIngestSample.sample5,
};

export function contractLineItemsDescription(items: ContractLineItem[]): string {
  const names = items.map((i) => i.name);
  if (names.length === 0) {
    return "No line items found in the contract. Add or map items from your site catalog.";
  }
  if (names.length <= 2) {
    return `Found ${items.length} line item${items.length === 1 ? "" : "s"} in the contract, covering ${names.join(" and ")}. Review quantities, pricing, and mapping to items in your site.`;
  }
  const head = names.slice(0, 2).join(", ");
  const rest = items.length - 2;
  return `Found ${items.length} line items in the contract, covering ${head} and ${rest} more. Review quantities, pricing, and mapping to items in your site.`;
}

export function contractLineItemsNeedMappingCount(items: ContractLineItem[]): number {
  return items.filter((i) => i.mappingStatus === "needs_mapping").length;
}

/** Infer ingest sample from known line-item ids when chrome sample id is unavailable. */
export function inferIngestSampleIdFromLineItems(
  items: ContractLineItem[],
): IngestQueueSampleId | undefined {
  const ids = new Set(items.map((item) => item.id));
  if (ids.has("li-growth-crm") || ids.has("li-onboarding") || ids.has("li-support")) {
    return "sample2";
  }
  if (ids.has("li-pioneer-platform") || ids.has("li-pioneer-impl")) {
    return "sample5";
  }
  return undefined;
}

export interface ItemsTabActionSummary {
  totalCount: number;
  unmappedMatchCount: number;
}

/** Derives Items-tab "action needed" counts from line items. */
export function deriveItemsTabActionSummary(
  items: ContractLineItem[],
  _sampleId: IngestQueueSampleId | undefined,
  resolvedLineIds: ReadonlySet<string> = new Set(),
): ItemsTabActionSummary {
  // Count only unmapped items that haven't been resolved yet
  // System-matched items are pre-matched and don't require action
  const unmappedMatchCount = items.filter(
    (item) => item.mappingStatus === "needs_mapping" && !resolvedLineIds.has(item.id),
  ).length;
  const totalCount = unmappedMatchCount;
  return { totalCount, unmappedMatchCount };
}

export function getContractLineItemsForIngest(input: {
  sampleId?: IngestQueueSampleId;
  contractId?: string;
}): ContractLineItem[] {
  if (input.sampleId) {
    const fromSample = contractLineItemsByIngestSample[input.sampleId];
    if (fromSample.length > 0) {
      return fromSample.map((line) => ({ ...line }));
    }
  }
  if (input.contractId && contractLineItemsByContractId[input.contractId]?.length) {
    return contractLineItemsByContractId[input.contractId].map((line) => ({ ...line }));
  }
  return contractLineItemsByIngestSample.sample2.map((line) => ({ ...line }));
}
