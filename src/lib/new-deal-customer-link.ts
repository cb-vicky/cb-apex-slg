import type { NavigateFunction } from "react-router-dom";
import type { ExtractedContract } from "@/data/ingest-data";
import { getExtractedContract } from "@/data/ingest-data";
import type { QueueItem } from "@/data/queue-data";
import type { WorkbenchTask } from "@/data/workbench-tasks";

/** Workbench task ids for queue rows are prefixed with `queue-`. */
export function queueItemIdFromWorkbenchTask(task: WorkbenchTask): string | null {
  if (task.source !== "queue" || !task.id.startsWith("queue-")) return null;
  return task.id.slice("queue-".length);
}

/** New Business ingest rows without a resolved customer need the link modal first. */
export function needsNewDealCustomerLinkModal(q: QueueItem): boolean {
  if (q.scenario !== "New Business") return false;
  if (q.customerId) return false;
  if (!q.ingestable) return false;
  if (q.status !== "Pending Review" && q.status !== "In Progress" && q.status !== "Returned") {
    return false;
  }
  if (!q.sampleId) return true;
  const extracted = getExtractedContract(q.sampleId);
  return !extracted.customerFound;
}

export function getExtractedForQueueItem(q: QueueItem): ExtractedContract | null {
  if (!q.sampleId) return null;
  return getExtractedContract(q.sampleId);
}

export interface ExtractedCustomerSummary {
  company: string;
  contactName: string;
  contactEmail: string;
}

function emailFromContactName(name: string, domain: string): string {
  const cleanDomain = domain.replace(/^@/, "").trim();
  if (!cleanDomain) return "—";
  const parts = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}.${parts[parts.length - 1]}@${cleanDomain}`;
  }
  if (parts.length === 1) return `${parts[0]}@${cleanDomain}`;
  return `billing@${cleanDomain}`;
}

/** Display fields for the extracted-customer summary card in the link modal. */
export function getExtractedCustomerSummary(
  extracted: ExtractedContract | null,
  queueItem: QueueItem,
  overrides?: { company?: string; domain?: string },
): ExtractedCustomerSummary {
  const company =
    overrides?.company?.trim() || extracted?.customerName || queueItem.customerName;
  const domain =
    overrides?.domain?.trim() || suggestDomainFromCompanyName(company);
  const contactName = extracted?.primaryContactName ?? "—";
  const contactEmail =
    extracted?.primaryContactEmail ??
    (contactName !== "—" && domain
      ? emailFromContactName(contactName, domain)
      : domain
        ? `billing@${domain.replace(/^@/, "")}`
        : "—");

  return { company, contactName, contactEmail };
}

export function suggestDomainFromCompanyName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|corp|corporation|co)\b/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 28);
  return slug ? `${slug}.com` : "";
}

export function getCustomerContractTabUrl(
  customerId: string,
  opts?: { queueItemId?: string; contractId?: string; from?: string },
): string {
  const params = new URLSearchParams({ tab: "contract" });
  if (opts?.queueItemId) params.set("queueItemId", opts.queueItemId);
  if (opts?.contractId) params.set("contractId", opts.contractId);
  if (opts?.from) params.set("from", opts.from);
  return `/customers/${customerId}?${params.toString()}`;
}

/** Land on the customer Contracts tab, then open ingest for the linked queue item. */
export function openQueueIngestDrawer(
  queueItem: QueueItem,
  customerId: string,
  navigate: NavigateFunction,
  contractId?: string,
) {
  const resolvedContractId = contractId ?? queueItem.contractId ?? queueItem.activeContractId;
  navigate(
    getCustomerContractTabUrl(customerId, {
      queueItemId: queueItem.id,
      ...(resolvedContractId ? { contractId: resolvedContractId } : {}),
      from: "workbench",
    }),
  );
}
