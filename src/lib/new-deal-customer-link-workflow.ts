// Match-first vs standard customer link: variant resolution, closest/similar ranking.
// See docs/08-mock-data.md (queue fields) and docs/09-contract-ingestion.md (UX flow).

import type { ExtractedContract } from "@/data/ingest-data";
import type { Customer } from "@/data/mock-data";
import type { QueueItem } from "@/data/queue-data";
import {
  pioneerMatchFoundCustomerIds,
  pioneerSimilarLinkSearchCustomerIds,
} from "@/data/customer-link-search-seed";
import { suggestDomainFromCompanyName } from "@/lib/new-deal-customer-link";

export type CustomerLinkWorkflowVariant = "standard" | "match_first";

const PIONEER_CLOSEST_CUSTOMER_ID = "cust_pioneer_004";
const SIMILAR_MATCH_MIN_SCORE = 20;
const MAX_SIMILAR_MATCH_ROWS = 4;
export const MATCH_FOUND_BANNER_ROW_COUNT = 5;

export function getCustomerLinkWorkflowVariant(
  queueItem: QueueItem,
): CustomerLinkWorkflowVariant {
  if (queueItem.linkWorkflow === "match_first" || queueItem.linkWorkflow === "standard") {
    return queueItem.linkWorkflow;
  }
  if (queueItem.sampleId === "sample5") return "match_first";
  return "standard";
}

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchScore(extracted: ExtractedContract | null, queueItem: QueueItem, customer: Customer): number {
  const extractedName = normalizeToken(
    extracted?.customerName ?? queueItem.customerName,
  );
  const extractedDomain = normalizeToken(
    suggestDomainFromCompanyName(extracted?.customerName ?? queueItem.customerName),
  );
  const customerName = normalizeToken(customer.name);
  const customerLegal = normalizeToken(customer.billingLegalEntity);
  const customerDomain = normalizeToken(customer.domain.replace(/\.com$/, ""));

  let score = 0;
  if (extractedName && customerName && extractedName === customerName) score += 100;
  if (extractedName && customerName && (customerName.includes(extractedName) || extractedName.includes(customerName))) {
    score += 60;
  }
  if (extractedName && customerLegal && customerLegal.includes(extractedName.split(" ")[0] ?? "")) {
    score += 25;
  }
  if (extractedDomain && customerDomain && extractedDomain.includes(customerDomain.split(" ")[0] ?? "")) {
    score += 20;
  }
  if (extracted?.customerId === customer.id) score += 200;
  return score;
}

export function suggestClosestCustomerMatch(
  queueItem: QueueItem,
  extracted: ExtractedContract | null,
  customers: Customer[],
): Customer | null {
  if (queueItem.suggestedCustomerId) {
    return customers.find((c) => c.id === queueItem.suggestedCustomerId) ?? null;
  }
  if (queueItem.sampleId === "sample5") {
    return customers.find((c) => c.id === PIONEER_CLOSEST_CUSTOMER_ID) ?? null;
  }

  let best: Customer | null = null;
  let bestScore = 0;
  for (const customer of customers) {
    const score = matchScore(extracted, queueItem, customer);
    if (score > bestScore) {
      bestScore = score;
      best = customer;
    }
  }
  return bestScore >= 40 ? best : null;
}

function resolveSimilarMatchCustomers(
  queueItem: QueueItem,
  extracted: ExtractedContract | null,
  customers: Customer[],
  closestMatchId: string | null,
): Customer[] {
  if (!closestMatchId) return [];

  if (queueItem.sampleId === "sample5") {
    return pioneerSimilarLinkSearchCustomerIds
      .map((id) => customers.find((c) => c.id === id))
      .filter((c): c is Customer => c != null && c.id !== closestMatchId);
  }

  return customers
    .filter((c) => c.id !== closestMatchId)
    .map((customer) => ({ customer, score: matchScore(extracted, queueItem, customer) }))
    .filter(({ score }) => score >= SIMILAR_MATCH_MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SIMILAR_MATCH_ROWS)
    .map(({ customer }) => customer);
}

/** Match-found banner table — five selectable rows (closest first, then similar). */
export function buildMatchFoundCustomerList(
  queueItem: QueueItem,
  extracted: ExtractedContract | null,
  customers: Customer[],
): Customer[] {
  const closestMatchId =
    suggestClosestCustomerMatch(queueItem, extracted, customers)?.id ?? null;

  if (queueItem.sampleId === "sample5" && closestMatchId) {
    return pioneerMatchFoundCustomerIds
      .map((id) => customers.find((c) => c.id === id))
      .filter((c): c is Customer => c != null);
  }

  const browse = buildSimilarCustomerBrowseList(
    queueItem,
    extracted,
    customers,
    closestMatchId,
  );
  return browse.slice(0, MATCH_FOUND_BANNER_ROW_COUNT);
}

/** Similar-matches table: closest row first, then a few name-adjacent matches. */
export function buildSimilarCustomerBrowseList(
  queueItem: QueueItem,
  extracted: ExtractedContract | null,
  customers: Customer[],
  closestMatchId: string | null,
): Customer[] {
  const closest = closestMatchId
    ? (customers.find((c) => c.id === closestMatchId) ?? null)
    : null;
  const similar = resolveSimilarMatchCustomers(
    queueItem,
    extracted,
    customers,
    closestMatchId,
  );
  return closest ? [closest, ...similar] : similar;
}

/** Catalog list for browse — closest match first, then by similarity. */
export function rankCustomersForMatchBrowse(
  queueItem: QueueItem,
  extracted: ExtractedContract | null,
  customers: Customer[],
  closestMatchId: string | null,
): Customer[] {
  return [...customers].sort((a, b) => {
    if (closestMatchId) {
      if (a.id === closestMatchId) return -1;
      if (b.id === closestMatchId) return 1;
    }
    return matchScore(extracted, queueItem, b) - matchScore(extracted, queueItem, a);
  });
}
